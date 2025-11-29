import { io } from "socket.io-client";


export const socket= io('http://localhost:4001',{
    withCredentials:true,
    transports:["websocket",'polling']
})

