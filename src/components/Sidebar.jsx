import React, { useEffect, useRef, useState } from 'react'
import { useChatId } from '../globalState/chatIdStore.js'
import { useUserId } from '../globalState/userIdStorage.js'

import { AnimatePresence, motion } from "motion/react"
import { Ellipsis, RefreshCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Sidebar({ sideBar }) {
  const userId = useUserId((state) => state.userId)
  const [data, setData] = useState();
  const [error, setError] = useState();
  const navigate = useNavigate()

  const dataRef = useRef(data)


  async function handleSidebarData() {
    try {
      const response = await fetch(`http://localhost:4001/api/sideBar`, {
        method: 'GET',
        credentials: 'include'

      })

      if (!response.ok) {
        return setError("Error fetching data")
      }


      const result = await response.json()
      console.log("Sidebar", result)
      setData(result)



    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    handleSidebarData()
  }, [])

  useEffect(() => {

  }, [data])

  function handleDate(value) {
    const date = new Date(value)

    return date.toDateString()

  }


  function handleChat(item) {
    const chatId = item.chatId
    navigate(`/c/${chatId}`)
  }


  return (
    <AnimatePresence
    >
      {sideBar && (<motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -200, opacity: 0 }}
        className='bg-black/50  flex flex-col  items-center overflow-y-auto absolute z-20 left-0 w-[320px] top-[72px] bottom-0 border-r backdrop-blur-xs border-white '>
        <div className='flex justify-center items-center mt-5'>
          <h1 className='font-bold text-lg border-b-2 border-white-80 text-white'>Chat History</h1>
          <button onClick={handleSidebarData} className='cursor-pointer'><RefreshCcw strokeWidth={1.2} className='ml-5 text-white' /></button>
        </div>
        {data && (<div className=' flex flex-col mt-[20px]  w-full  justify-center items-center'>
          {data.map((item, index) => (
            <div className='flex relative  group cursor-pointer mt-[5px] bg-black/70 w-full justify-between items-center px-2 gap-5'>
              <button onClick={() => handleChat(item)} className='flex cursor-pointer   p-2 text-white  justify-center items-center'><div className='flex'>
                <h1 className='text-sm font-extralight'>{item.title}</h1>
              </div></button>
              <button className='text-white cursor-pointer invisible mr-5 group-hover:visible'><Ellipsis strokeWidth={1.2} /></button>
              <p className='invisible -translate-y-8 bg-white px-2 py-1 rounded-lg text-black group-hover:visible text-xs absolute  top-1 right-1 font-thin'>{handleDate(item.createdAt)}</p>

            </div>
          ))}
        </div>)}
      </motion.div>)}
    </AnimatePresence>
  )
}

export default Sidebar