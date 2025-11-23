import express from 'express';
import ChatList from '../schema/chatList.js';
const router=express.Router();

router.post('/chat', async (req,res)=>{
    try{
        const {userId,chatId}= req.body

        if (!userId) {
            return res.status(400).json({ 
                error: 'userId is required' 
            })
        }

         if (!chatId) {
            return res.status(400).json({ 
                error: 'chatId is required' 
            })
        }

       const response = await ChatList.create({
    userId: userId,
    chatId: chatId
                    })
    

    return res.status(201).json({ 
            success: true,
            chat:response
        })

    }catch(error){
             console.error('Database error:', error)
        return res.status(500).json({ 
            error:'Internal server error' 
        })
    }
})

export default router


