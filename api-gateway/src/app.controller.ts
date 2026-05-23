import { Controller, Post, Get, Delete, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({ secret: process.env.JWT_SECRET || 'super-secret-development-key' });

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private getUserId(authHeader: string): string {
    if (!authHeader) throw new UnauthorizedException('Missing token');
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwtService.verify(token);
      return decoded.sub;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('chat')
  async chat(
    @Headers('authorization') authHeader: string, 
    @Body('question') question: string,
    @Body('engine') engine: string // NEW: Accept engine choice
  ) {
    const userId = this.getUserId(authHeader);
    return await this.appService.askQuestion(question, userId, engine || 'gemini');
  }

  @Get('documents')
  async getDocuments(@Headers('authorization') authHeader: string) {
    const userId = this.getUserId(authHeader);
    return await this.appService.getUserDocuments(userId);
  }

  @Delete('documents/:id')
  async deleteDocument(@Headers('authorization') authHeader: string, @Param('id') documentId: string) {
    const userId = this.getUserId(authHeader);
    return await this.appService.deleteDocument(documentId, userId);
  }
}
