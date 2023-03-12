import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { UserAuth } from "src/auth/common/user-auth";
import { UserJwt } from "src/auth/common/user.decorato";
import { UserGuard } from "src/auth/gurards/user.guard";
import { WsGuard } from "src/auth/gurards/ws.guard";
//import { Server } from "http";

@WebSocketGateway({
    transports: ['websocket'],
    cors: {
        origin: '*',
    },
})
export class ChatGateway {

    //@WebSocketServer()
    //server: Server;

    @UseGuards(WsGuard)
    @SubscribeMessage('events')
    handleEvent( @MessageBody() data: string): string {
        // this.server.emit()

        console.log(data)
        return 'From Server';
    }
}