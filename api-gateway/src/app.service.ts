import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AppService {
  
  async askQuestion(question: string, userId: string, engine: string) {
    try {
      // 1. Fetch the last 5 conversation turns (10 messages total)
      const recentLogs = await prisma.queryLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // 2. Reverse them so the oldest is first, establishing chronological order
      recentLogs.reverse();

      // 3. Format them cleanly for Python
      const chatHistory = recentLogs.map(log => ({
        user: log.question,
        assistant: log.answer
      }));

      // 4. Send the question, engine, AND history to Python
      const response = await fetch('http://ai-worker:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          user_id: userId, 
          engine,
          chat_history: chatHistory 
        }) 
      });
      
      const data = await response.json();
      
      // 5. Save the NEW interaction to Postgres so it is remembered next time
      if (data.status === 'Success') {
        await prisma.queryLog.create({ data: { question, answer: data.answer, userId } });
      }
      
      return data;
    } catch (error) {
      throw new HttpException('AI Worker unreachable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getUserDocuments(userId: string) {
    return await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteDocument(documentId: string, userId: string) {
    const doc = await prisma.document.findFirst({ where: { id: documentId, userId } });
    if (!doc) throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    
    await prisma.document.delete({ where: { id: documentId } });

    try {
      await fetch(`http://ai-worker:8000/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
    } catch (e) {
      console.error("Failed to reach Python worker for vector deletion");
    }

    return { success: true, message: 'Document deleted successfully' };
  }
}
