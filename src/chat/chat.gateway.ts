import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
@WebSocketGateway({ cors: true })
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  @SubscribeMessage('join-room')
  handleEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const roomId = data[0];
    const userId = data[1];
    this.logger.debug(`room ${roomId} userId ${userId}`);
    client.join(roomId);
    client.to(roomId).emit('user-connected', userId);

    client.on('disconnect', () => {
      client.to(roomId).emit('user-disconnect', userId);
    });
  }
}
