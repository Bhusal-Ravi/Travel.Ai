import { create } from "zustand";


export const useUserId= create((set)=>(
    {
        userId:null,
        setUserId: (id)=>set({userId:id})

    }
))