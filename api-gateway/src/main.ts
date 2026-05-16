import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS so the React frontend can communicate with this API
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
