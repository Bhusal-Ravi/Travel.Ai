import React, { useState } from 'react'
import ChatUi from './ChatUi'
import { Menu, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { AnimatePresence, motion } from "motion/react"

function Home() {
    const [sideBar, setSideBar] = useState(false)
    return (

        <div className="min-h-screen w-full bg-black relative">
            {/* Midnight Mist */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
          radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.5) 0%, transparent 60%),
          radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 70%),
          radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.3) 0%, transparent 80%)
        `,
                }}
            />
            <div className='relative z-10 min-h-screen pb-[150px]' >
                <AnimatePresence
                >
                    {sideBar && (<motion.div
                        initial={{ x: -200, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -200, opacity: 0 }}
                        className='bg-black/50 overflow-y-auto absolute z-20 left-0 w-[320px] top-[72px] bottom-0 border-r backdrop-blur-xs border-white '>

                    </motion.div>)}
                </AnimatePresence>
                <div className=' flex  fixed z-20 w-full px-10 py-5 border-b border-white text-white backdrop-blur-xs'>
                    <div className=' justify-center items-center mr-auto flex '>
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ scale: 1.2 }}
                            onClick={() => setSideBar((prev) => !prev)}
                        > {!sideBar ? (<PanelRightClose strokeWidth={1.5} className='cursor-pointer' />) : (<PanelRightOpen strokeWidth={1.5} className='cursor-pointer' />)}</motion.button>
                        <h1 className='font-mono text-xl ml-5'>Travel.Ai</h1>
                    </div>
                    <div className='flex gap-4 ml-auto  '>
                        <h1>Home</h1>
                        <h1>AboutUs</h1>
                        <h1>Pricing</h1>
                        <h1>Github</h1>
                    </div>
                </div>

                <div className='mx-auto pt-[72px] max-w-3xl w-full '>
                    <ChatUi />
                </div>
            </div>

        </div >

    )
}

export default Home