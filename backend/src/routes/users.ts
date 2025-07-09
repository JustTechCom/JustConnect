// backend/src/routes/users.ts - Fixed version
import { Router, Request, Response } from 'express';
import { PrismaClient, FriendshipStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Get current user
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { firstName, lastName, bio } = req.body;

    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Search users
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { q: query, limit = '20', exclude } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const excludeIds = exclude ? 
      (typeof exclude === 'string' ? exclude.split(',') : []) : 
      [];

    const searchTerm = query.trim();
    const limitNum = parseInt(limit as string) || 20;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: excludeIds
            }
          },
          {
            banned: false
          },
          {
            OR: [
              {
                username: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
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
        createdAt: true
      },
      take: limitNum,
      orderBy: [
        { isOnline: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// Get user by ID
router.get('/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

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
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Send friend request
router.post('/friend-request', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { userId: targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Target user ID is required'
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send friend request to yourself'
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        error: 'Friendship already exists or request already sent'
      });
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: targetUserId,
        status: FriendshipStatus.PENDING
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        addressee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      friendship
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send friend request'
    });
  }
});

// Get friend requests
router.get('/friend-requests', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { type = 'received' } = req.query;

    let friendRequests;

    if (type === 'sent') {
      friendRequests = await prisma.friendship.findMany({
        where: {
          requesterId: userId,
          status: FriendshipStatus.PENDING // Fixed: Use enum instead of string
        },
        include: {
          addressee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isOnline: true,
              lastSeen: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      friendRequests = await prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: FriendshipStatus.PENDING // Fixed: Use enum instead of string
        },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isOnline: true,
              lastSeen: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    res.json({
      success: true,
      friendRequests
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friend requests'
    });
  }
});

// Respond to friend request
router.put('/friend-request/:friendshipId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { friendshipId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "accept" or "reject"'
      });
    }

    // Check if friendship exists and user is the addressee
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        addresseeId: userId,
        status: FriendshipStatus.PENDING // Fixed: Use enum instead of string
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }

    // Update friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: action === 'accept' ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED,
        respondedAt: new Date()
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        addressee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      friendship: updatedFriendship,
      action
    });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to friend request'
    });
  }
});

// Get friends list
router.get('/friends', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status: FriendshipStatus.ACCEPTED // Fixed: Use enum instead of string
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isOnline: true,
            lastSeen: true
          }
        },
        addressee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isOnline: true,
            lastSeen: true
          }
        }
      }
    });

    // Extract friends (the other user in each friendship)
    const friends = friendships.map(friendship => {
      return friendship.requesterId === userId 
        ? friendship.addressee 
        : friendship.requester;
    });

    res.json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friends'
    });
  }
});

// Remove friend
router.delete('/friends/:friendId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { friendId } = req.params;

    // Find and delete the friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId }
        ],
        status: FriendshipStatus.ACCEPTED // Fixed: Use enum instead of string
      }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friendship not found'
      });
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend'
    });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
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
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      user: updatedUser,
      avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

export default router;