import React, { useEffect, useState } from 'react'

import { AnimatePresence, motion } from "motion/react"

function Sidebar({ sideBar }) {
  return (
    <AnimatePresence
    >
      {sideBar && (<motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -200, opacity: 0 }}
        className='bg-black/50 overflow-y-auto absolute z-20 left-0 w-[320px] top-[72px] bottom-0 border-r backdrop-blur-xs border-white '>

      </motion.div>)}
    </AnimatePresence>
  )
}

export default Sidebar