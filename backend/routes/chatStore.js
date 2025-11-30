import mongoose from 'mongoose'
import express from 'express'
import ChatList from '../schema/chatList.js'
import ChatStorage from '../schema/chatstoreDb.js'
const router=express.Router()

router.post('/chatstore',async(req,res)=>{
    try{
        const {content,update,photoUrl,userId,chatId}=req.body
        
        console.log("ChatStorageContent ",content)
        console.log("ChatStoragePhoto",photoUrl)
        const title= content[0]?.message?.planOutline?.tripSummary

        const response= await ChatStorage.create({
            content,photoUrl,update,userId,chatId
        })
        console.log(response)

        const chatList= await ChatList.findOneAndUpdate(
            { chatId: chatId },  // filter
            { title: title },    // update
            { new: true, upsert: true } // options: return updated doc, create if not exist
        )

        console.log(chatList)

        

        return res.status(200).json({error:false,message:"DataBase Updated"})


    }catch(error){
        console.log(error)
        return res.status(500).json({error:true,message:"Internal Server Error"})
    }
})

export default router