import express from 'express'
import User from '../schema/User.js'
import ChatList from '../schema/chatList.js'
import { auth } from '../lib/auth.js'
import { fromNodeHeaders } from "better-auth/node";

const router= express.Router()





router.get('/sidebar', async(req,res)=>{
    try{
         const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return res.status(401).json({ message: "Not authenticated" });
        }

    
    const userId = session.user.id;

    const response= await ChatList.find({
        userId:userId
    })
    const correct= response.filter((item)=>(item.title))
	return res.json(correct);

    
    }catch(error){
       console.log(error)
    }
})

export default router