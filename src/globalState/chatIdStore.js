import { create } from "zustand";


export const useChatId= create((set)=>({
    chatId:null,//globalState,
    setChatId:(id)=> set({chatId:id}) //function to set chatid as global
}) ) 