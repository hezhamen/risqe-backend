import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'risqe_db',
  entities:
    process.env.NODE_ENV === 'production'
      ? ['dist/**/*.entity{.js}']
      : [__dirname + '/../**/*.entity.{ts,js}'],
  synchronize: process.env.NODE_ENV !== 'production', // Use migrations in production
};
