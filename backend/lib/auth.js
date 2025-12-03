import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dotenv from 'dotenv'
dotenv.config()

const client = new MongoClient(process.env.MONGO_URL);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
   
    client
  }),
   emailAndPassword: { 
    enabled: true, 
  },
   socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID , 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET , 
        }, 
        github: { 
            clientId: process.env.GITHUB_CLIENT_ID , 
            clientSecret: process.env.GITHUB_CLIENT_SECRET , 
        }, 
    },

    trustedOrigins:[
        "http://localhost:5173", // frontend
    "http://localhost:4001"  // backend 
    ]
 
});