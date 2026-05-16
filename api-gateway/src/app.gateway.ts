import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import WebSocket from 'ws';

// FIX: Increase the default 1MB limit to 50MB so large PDFs can pass through!
@WebSocketGateway({ cors: true, maxHttpBufferSize: 5e7 })
export class AppGateway {
  @SubscribeMessage('upload_file')
  handleUpload(@MessageBody() data: { filename: string, buffer: ArrayBuffer }, @ConnectedSocket() client: Socket) {
    const ext = data.filename.split('.').pop();
    
    // Connect to Python's internal K8s address
    const ws = new WebSocket('ws://ai-worker:8000/ws/upload');

    ws.on('open', () => {
      // Send metadata first, then the binary buffer
      ws.send(JSON.stringify({ ext }));
      ws.send(data.buffer);
    });

    // When Python sends a progress update, pipe it straight to React!
    ws.on('message', (message) => {
      const parsed = JSON.parse(message.toString());
      client.emit('upload_progress', parsed);
    });

    ws.on('error', (err) => {
      client.emit('upload_progress', { progress: 0, status: 'Error', message: 'Failed to connect to AI Worker.' });
    });
  }
}
