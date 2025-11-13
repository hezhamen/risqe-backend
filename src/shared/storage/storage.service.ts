import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    // Use Bucketeer credentials if available, otherwise fall back to AWS credentials
    this.bucketName =
      process.env.BUCKETEER_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || '';
    this.region =
      process.env.BUCKETEER_AWS_REGION || process.env.AWS_S3_REGION || 'eu-west-1';

    const accessKeyId =
      process.env.BUCKETEER_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

    if (!this.bucketName || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'S3 credentials not fully configured. File uploads may not work.',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  /**
   * Upload a file to S3 and return the public URL
   * @param file - The file buffer or stream
   * @param folder - The folder path in S3 (e.g., 'avatars', 'documents')
   * @param originalFilename - Original filename for extension detection
   * @returns Promise<string> - The public URL of the uploaded file
   */
  async uploadFile(
    file: Buffer | Express.Multer.File,
    folder: string,
    originalFilename?: string,
  ): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;
    const filename = Buffer.isBuffer(file)
      ? `${uuidv4()}.jpg`
      : this.generateUniqueFilename(originalFilename || file.originalname);

    const key = `${folder}/${filename}`;
    const contentType = this.getContentType(filename);

    try {
      const uploadParams: any = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      };

      // Try to set ACL if supported (some S3-compatible services don't support ACL)
      try {
        uploadParams.ACL = 'public-read';
      } catch {
        // ACL not supported, skip it
      }

      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });

      await upload.done();

      // Generate public URL - Bucketeer uses standard S3 URL format
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param url - The public URL of the file to delete
   */
  async deleteFile(url: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(url);

      if (!key) {
        throw new Error('Invalid S3 URL');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate a unique filename with UUID
   */
  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || 'jpg';
    return `${uuidv4()}.${extension}`;
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }

  /**
   * Extract S3 key from public URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}

