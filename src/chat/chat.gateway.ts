import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway(3002, { cors: true })
export class ChatGateway {
  @SubscribeMessage('join-room')
  handleEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const roomId = data[0];
    const userId = data[1];
    client.join(roomId);
    client.to(roomId).emit('user-connected', userId);

    client.on('disconnect', () => {
      client.to(roomId).emit('user-disconnect', userId);
    });
  }
}
