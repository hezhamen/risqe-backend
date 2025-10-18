import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Heroku provides this automatically
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'risqe_db',
  entities:
    process.env.NODE_ENV === 'production'
      ? ['dist/**/*.entity{.js}']
      : [__dirname + '/../**/*.entity.{ts,js}'],
  synchronize: true, // Enable for initial deployment - should use migrations in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
