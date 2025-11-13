import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

async function setBucketPolicy() {
  const bucketName =
    process.env.BUCKETEER_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  const region =
    process.env.BUCKETEER_AWS_REGION || process.env.AWS_S3_REGION || 'eu-west-1';
  const accessKeyId =
    process.env.BUCKETEER_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing required environment variables');
    console.error('Required: BUCKETEER_BUCKET_NAME, BUCKETEER_AWS_ACCESS_KEY_ID, BUCKETEER_AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Bucket policy to allow public read access for avatars and documents
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadAvatars',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/avatars/*`,
      },
      {
        Sid: 'PublicReadDocuments',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/documents/*`,
      },
    ],
  };

  try {
    console.log(`📦 Configuring bucket policy for: ${bucketName}`);
    console.log(`🌍 Region: ${region}`);

    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy),
    });

    await s3Client.send(command);

    console.log('✅ Bucket policy configured successfully!');
    console.log('📋 Policy allows public read access for:');
    console.log('   - /avatars/*');
    console.log('   - /documents/*');
  } catch (error: any) {
    console.error('❌ Failed to set bucket policy:', error.message);
    if (error.name === 'AccessDenied') {
      console.error('⚠️  Access denied. Check your AWS credentials have PutBucketPolicy permission.');
    }
    process.exit(1);
  }
}

setBucketPolicy();

