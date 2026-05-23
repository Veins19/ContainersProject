import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import WebSocket from 'ws';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jwtService = new JwtService({ secret: process.env.JWT_SECRET || 'super-secret-development-key' });

@WebSocketGateway({ cors: true, maxHttpBufferSize: 5e7 })
export class AppGateway {
  @SubscribeMessage('upload_file')
  async handleUpload(@MessageBody() data: { filename: string, buffer: ArrayBuffer, token: string }, @ConnectedSocket() client: Socket) {
    try {
      // 1. Verify the VIP Pass
      if (!data.token) throw new Error("No token provided");
      const decoded = jwtService.verify(data.token);
      const userId = decoded.sub;

      // 2. THE REHASHING FIX: Check if this file already exists in Postgres
      let doc = await prisma.document.findFirst({
        where: { filename: data.filename, userId }
      });

      // 3. If it doesn't exist, create it. If it DOES exist, we reuse the exact same ID!
      if (!doc) {
        doc = await prisma.document.create({
          data: { filename: data.filename, userId }
        });
      }

      const ext = data.filename.split('.').pop();
      const ws = new WebSocket('ws://ai-worker:8000/ws/upload');

      ws.on('open', () => {
        // 4. Send metadata + user_id + the stable document_id to Python
        ws.send(JSON.stringify({ ext, user_id: userId, document_id: doc.id }));
        ws.send(data.buffer);
      });

      ws.on('message', (message) => {
        const parsed = JSON.parse(message.toString());
        client.emit('upload_progress', parsed);
      });

      ws.on('error', (err) => {
        client.emit('upload_progress', { progress: 0, status: 'Error', message: 'Failed to connect to AI Worker.' });
      });

    } catch (error: any) {
      console.error("UPLOAD CRASH:", error); 
      client.emit('upload_progress', { 
        progress: 0, 
        status: 'Error', 
        message: error.message || 'Internal server error during upload.' 
      });
    }
  }
}
