import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TodoListsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinList')
    handleJoinList(
        @MessageBody() listId: number,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`list_${listId}`);
        return { event: 'joinedList', data: listId };
    }

    @SubscribeMessage('leaveList')
    handleLeaveList(
        @MessageBody() listId: number,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`list_${listId}`);
        return { event: 'leftList', data: listId };
    }

    notifyItemUpdated(listId: number, item: any) {
        this.server.to(`list_${listId}`).emit('itemUpdated', item);
    }
}
