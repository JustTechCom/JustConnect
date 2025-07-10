// backend/src/routes/chats.ts - Fixed Prisma type issues
import { Router, Request, Response } from 'express';
import { PrismaClient, ChatType, MemberRole } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user's chats
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const chats = await prisma.chat.findMany({
  where: {
    members: {
      some: {
        userId: req.user!.id
      }
    }
  },
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
            verified: true
          }
        }
      }
    },
    lastMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    },
    _count: {
      select: {
        messages: true
      }
    }
  },
  orderBy: {
    updatedAt: 'desc'
  }
});

    // Transform the data
    const transformedChats = chats.map(chat => ({
      id: chat.id,
      name: chat.name,
      type: chat.type,
      avatar: chat.avatar,
      description: chat.description,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      createdBy: chat.createdBy,
      lastMessage: chat.messages[0]?.content || null,
      lastMessageAt: chat.messages[0]?.createdAt || chat.createdAt,
      messageCount: chat._count.messages,
      members: chat.members.map(member => ({
        id: member.id,
        chatId: member.chatId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          avatar: member.user.avatar,
          isOnline: member.user.isOnline,
          lastSeen: member.user.lastSeen
        }
      }))
    }));

    res.json({
      success: true,
      chats: transformedChats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats'
    });
  }
});

// Create a new chat - FIXED: Prisma type issue
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, memberIds, name, description } = req.body;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    // Validate input
    if (!type || !['DIRECT', 'GROUP', 'CHANNEL'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat type'
      });
    }

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        error: 'Member IDs are required'
      });
    }

    if (memberIds.some(id => !id)) {
      return res.status(400).json({ success: false, error: "Invalid member ID in list" });
    }
    
    // For direct chats, ensure only one other member
    if (type === 'DIRECT' && memberIds.length !== 1) {
      return res.status(400).json({
        success: false,
        error: 'Direct chats must have exactly one other member'
      });
    }

    console.log('userId:', userId);
    console.log('memberIds:', memberIds);
    
    // Check if direct chat already exists
    if (type === 'DIRECT') {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            {
              members: {
                some: {
                  userId: userId
                }
              }
            },
            {
              members: {
                some: {
                  userId: memberIds[0]
                }
              }
            }
          ]
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      if (existingChat) {
        return res.json({
          success: true,
          chat: {
            id: existingChat.id,
            name: existingChat.name,
            type: existingChat.type,
            avatar: existingChat.avatar,
            description: existingChat.description,
            createdAt: existingChat.createdAt,
            updatedAt: existingChat.updatedAt,
            createdBy: existingChat.createdBy,
            lastMessage: null,
            lastMessageAt: existingChat.createdAt,
            messageCount: 0,
            members: existingChat.members.map(member => ({
              id: member.id,
              chatId: member.chatId,
              userId: member.userId,
              role: member.role,
              joinedAt: member.joinedAt,
              user: {
                id: member.user.id,
                username: member.user.username,
                firstName: member.user.firstName,
                lastName: member.user.lastName,
                avatar: member.user.avatar,
                isOnline: member.user.isOnline,
                lastSeen: member.user.lastSeen
              }
            }))
          }
        });
      }
    }

    // FIXED: Create the chat with proper type structure
    const chat = await prisma.chat.create({
      data: {
        type: type as ChatType,
        name: name || null,
        description: description || null,
        createdBy: userId,
        // FIXED: Use direct relation instead of nested create with connect
        members: {
          create: [
            {
              userId: userId,
              role: type === 'DIRECT' ? 'MEMBER' : 'ADMIN'
            },
            ...memberIds.map((memberId: string) => ({
              userId: memberId,
              role: 'MEMBER' as MemberRole
            }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    const transformedChat = {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      avatar: chat.avatar,
      description: chat.description,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      createdBy: chat.createdBy,
      lastMessage: null,
      lastMessageAt: chat.createdAt,
      messageCount: 0,
      members: chat.members.map(member => ({
        id: member.id,
        chatId: member.chatId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          avatar: member.user.avatar,
          isOnline: member.user.isOnline,
          lastSeen: member.user.lastSeen
        }
      }))
    };

    res.status(201).json({
      success: true,
      chat: transformedChat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat'
    });
  }
});

// Get specific chat - FIXED: Ensure members are included in query
router.get('/:chatId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // FIXED: Since we include members in the query, they will be available
    const transformedChat = {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      avatar: chat.avatar,
      description: chat.description,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      createdBy: chat.createdBy,
      lastMessage: chat.messages[0]?.content || null,
      lastMessageAt: chat.messages[0]?.createdAt || chat.createdAt,
      messageCount: chat._count.messages,
      members: chat.members.map(member => ({
        id: member.id,
        chatId: member.chatId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          avatar: member.user.avatar,
          isOnline: member.user.isOnline,
          lastSeen: member.user.lastSeen
        }
      }))
    };

    res.json({
      success: true,
      chat: transformedChat
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat'
    });
  }
});

// Update chat
router.put('/:chatId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { chatId } = req.params;
    const { name, description, avatar } = req.body;

    // Check if user is a member and has permission to update
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
        role: {
          in: ['ADMIN', 'MODERATOR']
        }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this chat'
      });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        updatedAt: new Date()
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    const transformedChat = {
      id: updatedChat.id,
      name: updatedChat.name,
      type: updatedChat.type,
      avatar: updatedChat.avatar,
      description: updatedChat.description,
      createdAt: updatedChat.createdAt,
      updatedAt: updatedChat.updatedAt,
      createdBy: updatedChat.createdBy,
      lastMessage: null,
      lastMessageAt: updatedChat.updatedAt,
      messageCount: 0,
      members: updatedChat.members.map(member => ({
        id: member.id,
        chatId: member.chatId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          avatar: member.user.avatar,
          isOnline: member.user.isOnline,
          lastSeen: member.user.lastSeen
        }
      }))
    };

    res.json({
      success: true,
      chat: transformedChat
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chat'
    });
  }
});

// Add members to chat
router.post('/:chatId/members', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { chatId } = req.params;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        error: 'Member IDs are required'
      });
    }

    // Check if user has permission to add members
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
        role: {
          in: ['ADMIN', 'MODERATOR']
        }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to add members to this chat'
      });
    }

    // Check chat type - can't add members to direct chats
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true }
    });

    if (chat?.type === 'DIRECT') {
      return res.status(400).json({
        success: false,
        error: 'Cannot add members to direct chats'
      });
    }

    // Add new members
    const newMembers = await prisma.chatMember.createMany({
      data: memberIds.map((memberId: string) => ({
        chatId: chatId,
        userId: memberId,
        role: 'MEMBER' as MemberRole
      })),
      skipDuplicates: true
    });

    // Get updated chat with all members
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      addedMembers: newMembers.count,
      chat: updatedChat
    });
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add members'
    });
  }
});

// Leave chat
router.post('/:chatId/leave', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { chatId } = req.params;

    // Check if user is a member
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId: chatId,
        userId: userId
      }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        error: 'You are not a member of this chat'
      });
    }

    // Remove the user from the chat
    await prisma.chatMember.delete({
      where: {
        id: membership.id
      }
    });

    res.json({
      success: true,
      message: 'Successfully left the chat'
    });
  } catch (error) {
    console.error('Error leaving chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave chat'
    });
  }
});

export default router;