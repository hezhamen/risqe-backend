const { Client } = require('pg');

async function migrateProductionDatabase() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database');

    // First, let's see what users we have (without firstName/lastName for now)
    const result = await client.query('SELECT id, email, "phoneNumber" FROM users LIMIT 5');
    console.log('📊 Current users (sample):', result.rows);

    // Add firstName and lastName columns if they don't exist
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "firstName" VARCHAR
      `);
      console.log('✅ Added firstName column');
    } catch (error) {
      console.log('ℹ️  firstName column might already exist:', error.message);
    }

    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "lastName" VARCHAR
      `);
      console.log('✅ Added lastName column');
    } catch (error) {
      console.log('ℹ️  lastName column might already exist:', error.message);
    }

    // Update users with null firstName and lastName
    const updateResult = await client.query(`
      UPDATE users 
      SET "firstName" = 'User', "lastName" = 'Name'
      WHERE "firstName" IS NULL OR "lastName" IS NULL
    `);

    console.log(`✅ Updated ${updateResult.rowCount} users with default names`);

    // Now let's make firstName and lastName NOT NULL
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN "firstName" SET NOT NULL
    `);

    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN "lastName" SET NOT NULL
    `);

    console.log('✅ Made firstName and lastName columns NOT NULL');

    // Verify the changes
    const finalResult = await client.query('SELECT id, email, "phoneNumber", "firstName", "lastName" FROM users LIMIT 5');
    console.log('📊 Final users (sample):', finalResult.rows);

    console.log('🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
migrateProductionDatabase();
