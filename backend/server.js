import express from 'express'
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import chatRoute from './routes/userInput.js'
import photoRoute from './routes/photo.js'
import newChatRoute from './routes/chat.js'
import connectdb from './config/dbConnection.js'
import chatStoreRoute from './routes/chatStore.js'
import sideBarRoute from './routes/sideBar.js'

import {createServer} from 'http';
import {Server} from 'socket.io';
import registerSocket from './config/sockerConnection.js';
import { setchatId } from './graph.js';





dotenv.config();

const router= express.Router()
const app=express()
const PORT = process.env.PORT || 3000;

// Socket

const httpServer= createServer(app)
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection",(socket)=>{
    console.log("User Connected",socket.id)

    socket.on('joinChat',(chatId)=>{
        
        socket.join(chatId)
        console.log(`Client ${socket.id} joined Chat ${chatId}`)
        setchatId(chatId)
    })

    registerSocket(io,socket)
})


app.use(
    cors({
        origin: ['http://localhost:5173'],
        methods: "GET,POST,PUT,DELETE",
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
       
    })
);
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json());


// Routes

app.use('/api',chatRoute)
app.use('/api',photoRoute)
app.use('/api',newChatRoute)
app.use('/api',chatStoreRoute)
app.use('/api',sideBarRoute)
connectdb();





// Start server
const server =httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
