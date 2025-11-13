import express from 'express'
import dotenv from 'dotenv'

dotenv.config()


const router= express.Router()


async function getPhotosByLocation(location){
    try{
         const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(location)}&per_page=3&orientation=portrait`; // 5 photos per location
  const response = await fetch(url, {
    headers: {
      Authorization: process.env.PIXEL_API
    }
  });
  const result= await response.json()
  return result.photos
    }catch(error){
            console.log(error)
    }
}


router.post('/photo',async(req,res)=>{
   

        try{
             const location= req.body.location
             if(!location.length){
                return res.status(400).json({error:true,message:"No Location Provided"})
             }
            const result = await Promise.all(location.map(getPhotosByLocation));
            console.log("Photos:", result)
           return  res.status(200).json({error:false,message:result})

            
            
        }catch(error){
             return res.status(500).json({error:true,message:"Failed to fetch Photos"})
        }
})

export default router