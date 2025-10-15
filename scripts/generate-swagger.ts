import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Risqe API')
    .setDescription('API documentation for Risqe backend')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outPath = join(process.cwd(), 'swagger.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`Swagger schema written to ${outPath}`);
}

generate().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


