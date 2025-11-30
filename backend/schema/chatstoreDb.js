import mongoose from 'mongoose'
import User from './User.js'
import ChatList from './chatList.js'



const ChatStoreSchema= new mongoose.Schema({
 content: {
    type: Array, // stores array of objects
    required: true,
  },
  photoUrl: {
    type: Array, // stores an object
    required: true,
  },
  update:{
    type: Array, // stores an object
    required: true,
  },
   userId:{
          type: mongoose.Schema.Types.ObjectId,
          ref:'User'
      },
      chatId:{
         type:String,
         required:true,
         unique:true,
      },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

 

export default mongoose.model("ChatStorage", ChatStoreSchema);