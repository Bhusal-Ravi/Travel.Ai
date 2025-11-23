import mongoose from 'mongoose'
import User from './User.js'


const ChatListschema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    chatId:{
       type:String,
       required:true,
       unique:true
    },
    title:{
        type:String,
    },
    createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('ChatList',ChatListschema)