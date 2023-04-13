//import { Request } from 'express';
import { Socket } from 'socket.io';


// guard types
export type AuthPayload = {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  picture?: string;
};

//export type RequestWithAuth = Request & AuthPayload;
export type SocketWithAuth = Socket & AuthPayload;