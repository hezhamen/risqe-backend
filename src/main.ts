import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Risqe Backend API')
    .setDescription('A comprehensive API for managing ROSCA (Rotating Savings and Credit Association) groups, financial transactions, and community features.')
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication and phone verification')
    .addTag('ROSCA', 'ROSCA group management and operations')
    .addTag('Financials', 'Financial transactions and withdrawal requests')
    .addTag('Community', 'Community posts and interactions')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Setup Scalar API documentation with inline spec
  const scalarConfig = { 
    theme: 'default' as const, 
    spec: document
  };
  app.use('/reference', apiReference(scalarConfig));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/reference`);
}
bootstrap();
