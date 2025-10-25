import express from 'express'
import {regularCall,resumeCall} from '../graph.js'

const router= express.Router()


router.post('/userInput',async(req,res)=>{
    try{
        const {question,threadId}=req.body;
        if(!question){
            return res.status(400).json({error:"Question is required"})
        }
        
        const response= await regularCall(question)
        
        
        if(!response ){
            return res.status(404).json({error:"Failed to process request"})
        }
       return  res.status(200).json({output:response})

    }catch(error){
        console.log(error)
        return res.status(500).json(error)
    }
})


router.post('/userInputResume',async(req,res)=>{
    try{
        const {question,threadId}=req.body;
        if(!question){
            return res.status(400).json({error:"Question is required"})
        }
        
        const response= await resumeCall(question)
        
        
        if(!response || !response.trip){
            return res.status(404).json({error:"Failed to process request"})
        }
       return  res.status(200).json({output:response})

    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Failed to process request"})
    }
})

export default router