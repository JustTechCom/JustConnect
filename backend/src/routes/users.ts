// backend/src/routes/users.ts - Enhanced with friend system
import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { io } from '../app';

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
        verified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users with advanced filtering
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = 20, exclude } = req.query;
    const currentUserId = req.user!.id;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    // Build exclude list
    const excludeIds = [currentUserId];
    if (exclude && typeof exclude === 'string') {
      excludeIds.push(...exclude.split(','));
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludeIds } },
          { banned: false },
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isOnline: true,
        verified: true,
        bio: true
      },
      take: Number(limit),
      orderBy: [
        { isOnline: 'desc' },
        { username: 'asc' }
      ]
    });

    // Get friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: currentUserId, addresseeId: user.id },
              { requesterId: user.id, addresseeId: currentUserId }
            ]
          }
        });

        return {
          ...user,
          friendshipStatus: friendship?.status || 'none',
          isFriend: friendship?.status === 'ACCEPTED'
        };
      })
    );

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send friend request
router.post('/friend-request', authenticateToken, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;
    const requesterId = req.user!.id;

    if (requesterId === userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, avatar: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: userId },
          { requesterId: userId, addresseeId: requesterId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Friendship request already exists' });
    }

    // Create friendship request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true }
        }
      }
    });

    // Send real-time notification
    io.to(`user_${userId}`).emit('friend_request', {
      friendship,
      requester: friendship.requester
    });

    res.status(201).json({ 
      message: 'Friend request sent successfully',
      friendship 
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept/Reject friend request
router.put('/friend-request/:friendshipId', authenticateToken, [
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { friendshipId } = req.params;
    const { action } = req.body;
    const userId = req.user!.id;

    // Find the friendship request
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        addresseeId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true }
        }
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

    // Update friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: newStatus },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true }
        },
        addressee: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true }
        }
      }
    });

    // If accepted, create a direct chat
    if (action === 'accept') {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          members: {
            every: {
              userId: { in: [friendship.requesterId, userId] }
            }
          }
        }
      });

      if (!existingChat) {
        await prisma.chat.create({
          data: {
            type: 'DIRECT',
            createdBy: userId,
            members: {
              create: [
                { userId: friendship.requesterId, role: 'MEMBER' },
                { userId, role: 'MEMBER' }
              ]
            }
          }
        });
      }
    }

    // Send real-time notification to requester
    io.to(`user_${friendship.requesterId}`).emit('friend_request_response', {
      friendship: updatedFriendship,
      action
    });

    res.json({ 
      message: `Friend request ${action}ed successfully`,
      friendship: updatedFriendship 
    });
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friend requests
router.get('/friend-requests', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type = 'received' } = req.query;

    const where = type === 'sent' 
      ? { requesterId: userId, status: 'PENDING' }
      : { addresseeId: userId, status: 'PENDING' };

    const friendRequests = await prisma.friendship.findMany({
      where,
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true, isOnline: true }
        },
        addressee: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true, isOnline: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ friendRequests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friends list
router.get('/friends', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true, isOnline: true, lastSeen: true }
        },
        addressee: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true, isOnline: true, lastSeen: true }
        }
      }
    });

    const friends = friendships.map(friendship => {
      return friendship.requesterId === userId 
        ? friendship.addressee 
        : friendship.requester;
    });

    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove friend
router.delete('/friends/:friendId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.params;
    const userId = req.user!.id;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId }
        ],
        status: 'ACCEPTED'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    // Send notification to the removed friend
    io.to(`user_${friendId}`).emit('friend_removed', {
      userId
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('username').optional().trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/)
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { firstName, lastName, bio, username } = req.body;

    // Check if username is taken (if username is being updated)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(username && { username })
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
        verified: true,
        createdAt: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;