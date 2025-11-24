import React, { useState } from 'react'
import ChatUi from './ChatUi'
import { Menu, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { AnimatePresence, motion } from "motion/react"
import Logout from './Logout'
import Sidebar from './Sidebar'


function Home() {

    const [sideBar, setSideBar] = useState(false)

    return (

        <div className="min-h-screen w-full relative">
            {/* Radial Gradient Background from Top */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: "radial-gradient(125% 125% at 50% 10%, #9b9b88 40%, #475569 100%)",
                }}
            />

            <div className='relative z-10 min-h-screen pb-[150px]' >
                {/* Sidebar */}
                <Sidebar sideBar={sideBar} />
                {/* Sidebar  */}


                <div className=' flex   fixed z-20 bg-black/20 w-full px-10 py-5 border-b border-white text-white backdrop-blur-xs'>
                    <div className=' justify-center items-center mr-auto flex '>
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ scale: 1.2 }}
                            onClick={() => setSideBar((prev) => !prev)}
                        > {!sideBar ? (<PanelRightClose strokeWidth={1.5} className='cursor-pointer' />) : (<PanelRightOpen strokeWidth={1.5} className='cursor-pointer' />)}</motion.button>
                        <h1 className='font-mono text-xl ml-5 text-white'>Travel.Ai</h1>
                    </div>
                    <div className='text-white flex gap-4 ml-auto   '>
                        <Logout />
                        <h1>Home</h1>
                        <h1>AboutUs</h1>
                        <h1>Pricing</h1>
                        <h1>Github</h1>
                    </div>
                </div>

                <div className='mx-auto pt-[72px] max-w-7xl w-full '>
                    <ChatUi />
                </div>
            </div>

        </div >

    )
}

export default Home