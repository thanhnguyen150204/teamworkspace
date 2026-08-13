import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true, // reflect request origin — phù hợp với credentials: true
    credentials: true,
  },
})
export class ProjectGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private extractUserId(client: Socket): number | null {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return null;
      const secret = this.configService.get<string>('auth.jwtSecret');
      const payload = this.jwtService.verify(token, { secret });
      return payload?.sub ?? payload?.id ?? null;
    } catch {
      return null;
    }
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) {
      console.warn(`WS: Unauthorized connection attempt from ${client.id}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
    console.log(`WS: Client connected — socket=${client.id}, userId=${userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS: Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_project')
  handleJoinProject(
    @MessageBody() data: { projectId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project-${data.projectId}`;
    client.join(room);
    console.log(`WS: Client ${client.id} joined room: ${room}`);
    return { event: 'joined', data: { room } };
  }

  @SubscribeMessage('leave_project')
  handleLeaveProject(
    @MessageBody() data: { projectId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project-${data.projectId}`;
    client.leave(room);
    console.log(`WS: Client ${client.id} left room: ${room}`);
    return { event: 'left', data: { room } };
  }

  broacastToProject(projectId: number, event: string, data: unknown) {
    this.server.to(`project-${projectId}`).emit(event, data);
  }
}