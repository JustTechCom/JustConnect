// backend/src/services/fileUploadService.ts
import AWS from 'aws-sdk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { paymentService } from './paymentService';
import path from 'path';
import fs from 'fs';

interface FileUploadResult {
  fileId: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number; // for video/audio files
}

interface FileProcessingOptions {
  generateThumbnail?: boolean;
  compressImage?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

class FileUploadService {
  private s3: AWS.S3;
  private bucketName: string;
  private cloudFrontDomain?: string;
  private s3Client: S3Client;

constructor() {
  this.s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

  // Configure multer for file uploads
  getMulterConfig(userId: string) {
    const storage = multerS3({
      s3: this.s3,
      bucket: this.bucketName,
      acl: 'private', // Files are private by default
      key: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = `users/${userId}/files/${fileName}`;
        cb(null, filePath);
      },
      metadata: (req, file, cb) => {
        cb(null, {
          userId,
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
        });
      },
    });

    return multer({
      storage,
      limits: {
        fileSize: this.getMaxFileSize(userId),
        files: 10, // Max 10 files per request
      },
      fileFilter: this.fileFilter.bind(this),
    });
  }

  // File filter for security
  private fileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  }

  // Upload file and process it
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    chatId?: string,
    options: FileProcessingOptions = {}
  ): Promise<FileUploadResult> {
    try {
      // Check user's storage quota
      await this.checkStorageQuota(userId, file.size);

      // Upload to S3
      const uploadResult = await this.uploadToS3(userId, file);

      // Process file based on type
      let thumbnailUrl: string | undefined;
      let duration: number | undefined;

      if (file.mimetype.startsWith('image/')) {
        if (options.compressImage) {
          await this.compressImage(uploadResult.key, options);
        }
        if (options.generateThumbnail) {
          thumbnailUrl = await this.generateImageThumbnail(uploadResult.key);
        }
      } else if (file.mimetype.startsWith('video/')) {
        duration = await this.getVideoDuration(uploadResult.key);
        if (options.generateThumbnail) {
          thumbnailUrl = await this.generateVideoThumbnail(uploadResult.key);
        }
      } else if (file.mimetype.startsWith('audio/')) {
        duration = await this.getAudioDuration(uploadResult.key);
      }

      // Save file metadata to database
      const fileRecord = await prisma.file.create({
        data: {
          id: uuidv4(),
          userId,
          chatId,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          s3Key: uploadResult.key,
          url: this.getFileUrl(uploadResult.key),
          thumbnailUrl,
          duration,
          metadata: {
            uploadDate: new Date(),
            processedAt: new Date(),
            ...uploadResult.metadata,
          },
        },
      });

      // Update user's storage usage
      await this.updateStorageUsage(userId, file.size);

      return {
        fileId: fileRecord.id,
        url: fileRecord.url,
        filename: fileRecord.filename,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        thumbnailUrl,
        duration,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Generate signed URL for file access
  async getSignedUrl(fileId: string, userId: string, expiresIn = 3600): Promise<string> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found or access denied');
    }

    const params = {
      Bucket: this.bucketName,
      Key: file.s3Key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  // Delete file
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, userId },
      });

      if (!file) {
        return false;
      }

      // Delete from S3
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: file.s3Key,
      }).promise();

      // Delete thumbnail if exists
      if (file.thumbnailUrl) {
        const thumbnailKey = this.extractS3KeyFromUrl(file.thumbnailUrl);
        await this.s3.deleteObject({
          Bucket: this.bucketName,
          Key: thumbnailKey,
        }).promise();
      }

      // Delete from database
      await prisma.file.delete({ where: { id: fileId } });

      // Update storage usage
      await this.updateStorageUsage(userId, -file.size);

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  // Get user's files
  async getUserFiles(
    userId: string,
    page = 1,
    limit = 20,
    type?: string
  ): Promise<{ files: any[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    if (type) {
      where.mimeType = { startsWith: type };
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          url: true,
          thumbnailUrl: true,
          duration: true,
          createdAt: true,
        },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files,
      total,
      hasMore: total > skip + limit,
    };
  }

  // Get storage usage for user
  async getStorageUsage(userId: string): Promise<{ used: number; limit: number; percentage: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { files: true } } },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await paymentService.getUserSubscription(userId);
    const storageLimit = subscription.maxStorage * 1024 * 1024 * 1024; // Convert GB to bytes

    const used = await prisma.file.aggregate({
      where: { userId },
      _sum: { size: true },
    });

    const usedBytes = used._sum.size || 0;
    const percentage = Math.round((usedBytes / storageLimit) * 100);

    return {
      used: usedBytes,
      limit: storageLimit,
      percentage,
    };
  }

  // Private helper methods
  private async uploadToS3(userId: string, file: Express.Multer.File): Promise<any> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `users/${userId}/files/${fileName}`;

    const params = {
      Bucket: this.bucketName,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId,
        originalName: file.originalname,
        uploadDate: new Date().toISOString(),
      },
    };

    const result = await this.s3.upload(params).promise();
    return {
      key: filePath,
      location: result.Location,
      metadata: params.Metadata,
    };
  }

  private async checkStorageQuota(userId: string, fileSize: number): Promise<void> {
    const storageUsage = await this.getStorageUsage(userId);
    
    if (storageUsage.used + fileSize > storageUsage.limit) {
      throw new Error('Storage quota exceeded. Please upgrade your plan or delete some files.');
    }
  }

  private async getMaxFileSize(userId: string): Promise<number> {
    const subscription = await paymentService.getUserSubscription(userId);
    return (subscription.maxFileSize || 5) * 1024 * 1024; // Convert MB to bytes
  }

  private async updateStorageUsage(userId: string, sizeDelta: number): Promise<void> {
    // This could be implemented with a separate storage_usage table for better performance
    // For now, we calculate it on-demand in getStorageUsage
  }

  private getFileUrl(s3Key: string): string {
    if (this.cloudFrontDomain) {
      return `https://${this.cloudFrontDomain}/${s3Key}`;
    }
    return `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;
  }

  private extractS3KeyFromUrl(url: string): string {
    if (this.cloudFrontDomain && url.includes(this.cloudFrontDomain)) {
      return url.split(this.cloudFrontDomain + '/')[1];
    }
    return url.split('.amazonaws.com/')[1];
  }

  private async compressImage(s3Key: string, options: FileProcessingOptions): Promise<void> {
    try {
      // Download image from S3
      const object = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: s3Key,
      }).promise();

      // Compress using Sharp
      let sharpInstance = sharp(object.Body as Buffer);

      if (options.maxWidth || options.maxHeight) {
        sharpInstance = sharpInstance.resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const compressedBuffer = await sharpInstance
        .jpeg({ quality: options.quality || 85 })
        .toBuffer();

      // Upload compressed version back to S3
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: compressedBuffer,
        ContentType: 'image/jpeg',
      }).promise();
    } catch (error) {
      console.error('Image compression failed:', error);
    }
  }

  private async generateImageThumbnail(s3Key: string): Promise<string> {
    try {
      // Download original image
      const object = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: s3Key,
      }).promise();

      // Generate thumbnail
      const thumbnailBuffer = await sharp(object.Body as Buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail
      const thumbnailKey = s3Key.replace(/(\.[^.]+)$/, '_thumb$1');
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
      }).promise();

      return this.getFileUrl(thumbnailKey);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return '';
    }
  }

  private async generateVideoThumbnail(s3Key: string): Promise<string> {
    try {
      // This would require a more complex setup with FFmpeg in a Lambda function
      // or a separate video processing service
      // For now, return empty string
      return '';
    } catch (error) {
      console.error('Video thumbnail generation failed:', error);
      return '';
    }
  }

  private async getVideoDuration(s3Key: string): Promise<number> {
    try {
      // This would require FFmpeg or a video processing service
      // For now, return 0
      return 0;
    } catch (error) {
      console.error('Video duration extraction failed:', error);
      return 0;
    }
  }

  private async getAudioDuration(s3Key: string): Promise<number> {
    try {
      // This would require FFmpeg or an audio processing service
      // For now, return 0
      return 0;
    } catch (error) {
      console.error('Audio duration extraction failed:', error);
      return 0;
    }
  }

  // Virus scanning integration
  async scanFile(s3Key: string): Promise<boolean> {
    try {
      // Integration with virus scanning service like ClamAV
      // For now, return true (clean)
      return true;
    } catch (error) {
      console.error('Virus scanning failed:', error);
      return false;
    }
  }

  // Clean up old files
  async cleanupOldFiles(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Find orphaned files (not associated with any message)
      const orphanedFiles = await prisma.file.findMany({
        where: {
          createdAt: { lte: thirtyDaysAgo },
          messages: { none: {} },
        },
      });

      for (const file of orphanedFiles) {
        await this.deleteFile(file.id, file.userId);
      }

      console.log(`Cleaned up ${orphanedFiles.length} orphaned files`);
    } catch (error) {
      console.error('File cleanup failed:', error);
    }
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;