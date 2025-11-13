import { S3Client, PutPublicAccessBlockCommand, GetPublicAccessBlockCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function configureBucket() {
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
    process.exit(1);
  }

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    console.log(`📦 Configuring bucket: ${bucketName}`);
    console.log(`🌍 Region: ${region}\n`);

    // Step 1: Check current Block Public Access settings
    console.log('1️⃣ Checking Block Public Access settings...');
    try {
      const getPublicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      console.log('   Current settings:', getPublicAccessBlock.PublicAccessBlockConfiguration);
    } catch (error: any) {
      if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
        console.log('   ⚠️  No Block Public Access configuration found (may be using defaults)');
      } else {
        console.log('   ⚠️  Could not check settings:', error.message);
      }
    }

    // Step 2: Disable Block Public Access (allow public policies and ACLs)
    console.log('\n2️⃣ Disabling Block Public Access...');
    try {
      await s3Client.send(
        new PutPublicAccessBlockCommand({
          Bucket: bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            IgnorePublicAcls: false,
            BlockPublicPolicy: false,
            RestrictPublicBuckets: false,
          },
        })
      );
      console.log('   ✅ Block Public Access disabled');
    } catch (error: any) {
      console.error('   ❌ Failed to disable Block Public Access:', error.message);
      if (error.name === 'AccessDenied') {
        console.error('   ⚠️  You may not have permission to modify Block Public Access settings.');
        console.error('   💡 Bucketeer buckets may already be configured for public access.');
      }
    }

    // Step 3: Set bucket policy
    console.log('\n3️⃣ Setting bucket policy...');
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
      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(bucketPolicy),
        })
      );
      console.log('   ✅ Bucket policy set successfully');
      console.log('   📋 Public read access enabled for:');
      console.log('      - /avatars/*');
      console.log('      - /documents/*');
    } catch (error: any) {
      console.error('   ❌ Failed to set bucket policy:', error.message);
      if (error.name === 'AccessDenied') {
        console.error('   ⚠️  Permission denied. Bucketeer may manage policies automatically.');
      }
    }

    console.log('\n✅ Configuration complete!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

configureBucket();

