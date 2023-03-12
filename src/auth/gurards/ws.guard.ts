import { Injectable, CanActivate } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";
import { ChatService } from "src/chat/chat.service";

@Injectable()
export class WsGuard implements CanActivate {

    constructor(
        private chatService: ChatService,
        private readonly jwtService: JwtService,
    ) { }

    canActivate(
        context: any,
    ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {

        const bearerToken = context.args[0].handshake.headers.authorization;

        if (bearerToken == null || bearerToken.split(' ').length == 0) return false;; 

        const bearerTokenSplit = context.args[0].handshake.headers.authorization.split(' ')[1];

        try {
            const decoded = this.jwtService.verify(bearerTokenSplit) as any;

            console.log(decoded);
            return new Promise((resolve, reject) => {

                return this.chatService.getUserById(decoded.userId).then(user => {
                    if (user) {
                        resolve(user);
                    } else {
                        reject(false);
                    }
                });
            });
        } catch (ex) {
            console.log(ex);
            console.log('here')
            return false;
        }
    }
}
