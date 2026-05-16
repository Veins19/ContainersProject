import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway'; // NEW

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AppGateway], // Registered here
})
export class AppModule {}
