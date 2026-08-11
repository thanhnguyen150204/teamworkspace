import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})

export class ProjectGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server : Server;

    handleConnection(client: Socket) {
        console.log(`Client conected ${client.id}`);
    }
    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_project')
    handleJoinProject(
        @MessageBody() data: {projectId: number},
        @ConnectedSocket () client: Socket,
    ){
        const room =`project-${data.projectId}`;
        client.join(room);
        console.log(`Client ${client.id} joined room: ${room}`);
        return { event: 'joined', data: {room}};
    }
    @SubscribeMessage('leave_project')
    handleLeaveProject(
        @MessageBody() data: {projectId: number},
        @ConnectedSocket () client: Socket,
    ){
        const room =`project-${data.projectId}`;
        client.leave(room);
        console.log(`Client ${client.id} left room: ${room}`);
        return { event: 'left', data: {room}};
    }
    broacastToProject( projectId: number, event: string, data: unknown){
        this.server.to(`project-${projectId}`).emit(event,data);
    }
}