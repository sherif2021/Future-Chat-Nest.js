import { Injectable, Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { SocketWithAuth } from "./common/types";
import { Namespace } from 'socket.io';
import { ChatService } from "./chat.service";
import { PrivateMessage } from "./entities/private-message.entity";
import { GroupMessage } from "./entities/group-message.entity";
import { Group } from "./entities/group.entity";

//import { Server } from "http";

@WebSocketGateway({
    transports: ['websocket'],
    cors: {
        origin: '*',
    },
})
@Injectable()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    constructor(private readonly chatService: ChatService) { }

    private readonly logger = new Logger(ChatGateway.name);

    @WebSocketServer()
    io: Namespace;

    @SubscribeMessage('events')
    handleEvent(@ConnectedSocket() client: SocketWithAuth, @MessageBody() data: string): WsResponse<string> {
        // this.server.emit()

        // this.io.emit('test', 'Sherif Sobhy'); to all sockets

        //this.io.adapter.rooms.get('').entries()

        //console.log(this.io.sockets.size())

        this.io.to(client.userId).emit('test', 'This Test Message');

        return { event: 'events', data: 'From Server' };
    }

    @SubscribeMessage('call-data')
    callData(@ConnectedSocket() client: SocketWithAuth, @MessageBody() data: any) {

        const { event, id, payload } = data;

        this.io.to(id).emit('call-data', {
            'payload': payload,
            'event': event,
            'id': client.userId,
        });
    }


    afterInit(): void {
        this.logger.log(`Websocket Gateway initialized.`);
    }

    async handleConnection(client: SocketWithAuth) {

        await client.join(client.userId);

        this.io.in(client.userId).fetchSockets().then(result => {
            if (result.length == 1) {
                this.chatService.updateIsUserOnline(client.userId, true);
                this.sendUserOnlineStatusToContacts(client.userId, true);
            }
        })

        this.logger.debug(`${client.firstName}(${client.phone}) = ${client.userId} Connected.`);

    }

    async handleDisconnect(client: SocketWithAuth) {

        await client.leave(client.userId);

        this.logger.debug(`${client.firstName}(${client.phone}) Disconnected.`);

        this.io.in(client.userId).fetchSockets().then(result => {
            if (result.length == 0) {
                this.chatService.updateIsUserOnline(client.userId, false);
                this.sendUserOnlineStatusToContacts(client.userId, false);
            }
        })
    }

    async isUserOnline(userId: string): Promise<boolean> {
        const result = await this.io.in(userId).fetchSockets();
        return result.length > 0;
    }

    async sendPrivateMessage(privateMessage: PrivateMessage, userId: string) {

        this.io.to(userId).emit('new-private-message', privateMessage);
    }

    async sendGroupMessage(groupMessage: GroupMessage, group: Group) {

        for (const member of group.members) {
            this.io.to(member).emit('new-group-message', groupMessage);
        }
    }

    async sendPrivateMessagesIsSent(senderId: string, receiverId: string, messagesIds: string[]) {

        this.io.to(senderId).emit('private-messages-is-sent', { userId: receiverId, messagesIds });
    }

    async sendRefreshContacts(userId: string) {

        this.io.to(userId).emit('refresh-contacts', '');
    }

    async sendPrivateMessagesIsSeen(senderId: string, receiverId: string, messagesIds: string[]) {

        this.io.to(senderId).emit('private-messages-is-seen', { userId: receiverId, messagesIds });
    }

    private async sendUserOnlineStatusToContacts(userId: string, status: boolean) {

        const data = await Promise.all([
            this.chatService.getContactsForOnlineStatus(userId),
            this.chatService.getUserOnlinePrivacy([userId]),
        ]);

        const contacts = data[0];
        const user = data[1][0];

        if (user.onlinePrivacy == 2 && status) return;

        const contactsData = await this.chatService.getUserOnlinePrivacy(contacts);

        for (const contact of contactsData) {
            if (contact.onlinePrivacy != 2)
                this.io.to(contact.id).emit('user-online-status', { userId, status, lastSeen: Date.now() });
        }
    }

    async sendCallRequest(userId: string, targetId: string, isVideo: boolean) {
        const user = await this.chatService.getUserById(userId);

        if (!user) return;

        this.io.to(targetId).emit('call-request', { id: userId, video: isVideo, name: `${user.firstName} ${user.lastName}`, picture: user.picture });
    }

    sendCloseCall(userId: string, targetId: string) {

        this.io.to(targetId).emit('close-call', { userId });
    }

    sendAcceptCall(userId: string, targetId: string) {

        this.io.to(targetId).emit('accept-call', { userId });
    }
}
