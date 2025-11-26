import express from 'express';
import ChatList from '../schema/chatList.js';
import ChatStorage from '../schema/chatstoreDb.js'
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



router.get('/chathistory/:chatId', async(req,res)=>{
    try{
        const {chatId}= req.params
        const response= await ChatStorage.findOne({
            chatId:chatId
        })

        if(!response){
            return res.status(404).json({error:true,message:"Respective chat history not found"})
        }
        
        return res.status(200).json({error:false,message:response})
        

    }catch(error){
       return res.status(500).json({error:true,message:"Internal Server Error"})
    }
})

export default router


