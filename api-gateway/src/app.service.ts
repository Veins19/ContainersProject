import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }

  async askQuestion(userQuestion: string) {
    try {
      const response = await fetch('http://ai-worker:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion }),
      });
      const aiData = await response.json();

      await this.queryLog.create({
        data: { question: userQuestion, answer: aiData.answer || JSON.stringify(aiData) },
      });

      return { answer: aiData.answer, context: aiData.retrieved_context };
    } catch (error) {
      return { answer: "Error connecting to AI logic." };
    }
  }

  async uploadDocument(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      
      // FIX: Cast file.buffer to 'any' to bypass the TypeScript strictness check
      const blob = new Blob([file.buffer as any], { type: file.mimetype });
      formData.append('file', blob, file.originalname);

      const response = await fetch('http://ai-worker:8000/upload', {
        method: 'POST',
        body: formData, 
      });
      return await response.json();
    } catch (error) {
      return { status: "Error", message: "Gateway failed to reach AI Worker." };
    }
  }
}
