import express from 'express'
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import chatRoute from './routes/userInput.js'
import photoRoute from './routes/photo.js'


dotenv.config();

const router= express.Router()
const app=express()
const PORT = process.env.PORT || 3000;


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





// Start server
const server = app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});

