import { CircleArrowUp, ExternalLink, Flame, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import React, { useState } from 'react'
import { AnimatePresence, motion } from "motion/react"

import AirplanePath from '../assets/arrow.svg?react'


function ChatUi() {
    const [loading, setLoading] = useState(false)
    const [state, setState] = useState();
    const [content, setContent] = useState([])
    const [error, setError] = useState();
    const [userMessage, setUserMessage] = useState()

    async function fetchState() {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:4001/api/userInput`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: `Plan me a trip to Greece, budget of about 1000$, trip of 5 days starting from tomorrow, travelling from Nepal, Kathmandu, I want to see the deep blue beaches plan accordingly`,
                    threadId: `user123`
                })
            })
            if (!response.ok) {
                setError(response.error)
            }

            const result = await response.json()

            setState(result)
            console.log(result)
            setContent((prev) => [...prev, { type: 'ai', message: result.output.message }])
            console.log(content)
            setLoading(false)
        } catch (error) { console.log(error) }
    }

    function handleCLick(e) {
        fetchState()

    }



    return (




        <div className='flex flex-col     '>
            <div className='flex-1 flex justify-center items-center  '>
                {/* ChatBox */}
                {state &&
                    <div className='text-white  border border-red-400  '>

                        <div className='flex flex-col bg- px-3 py-2 rounded-md  items-center mt-5 bg-linear-to-r from-[#434A72] via-[#292B44] to-[#0F1015] border-b border-white'>
                            <h1 className='border-b text-xl font-mono'><span className='mr-2'>Title:</span>{content[0].message.planOutline.tripSummary}</h1>
                            <p className='mt-2 text-sm font-light'><span className='font-semibold border-b border-green-600'>Start:</span> {content[0].message.trip?.startingLocation} | <span className='font-semibold border-b border-yellow-600'>Destination:</span> {content[0].message.trip?.destination} | <span className='font-semibold border-b border-red-600'>From</span> [ {content[0].message.trip?.startDate} ] <span className='font-semibold border-b border-red-600'>To</span> [ {content[0].message.trip?.endDate} ]   </p>
                        </div>
                        {/* Flight Information */}
                        <div className='mt-10  flex flex-col justify-center items-center'>
                            <h1 className='font-mono text-xl border-b border-white'>Flight Information</h1>
                            <div className='flex justify-center gap-10 items-center '>
                                <PlaneTakeoff className='mr-2' /><p className='font-semibold border-b border-green-600'>{content[0].message.flightAgent.route.origin?.city}, {content[0].message.flightAgent.route.origin?.country}</p>
                                <AirplanePath className='text-white  w-[100px] h-[120px]  ' />
                                <p className='font-semibold border-b border-yellow-600'>{content[0].message.flightAgent.route.destination?.city}, {content[0].message.flightAgent.route.destination?.country}</p><PlaneLanding className='mr-2' />
                            </div>

                            {/* Flight Detail */}
                            {/* // content[0].message */}
                            <div className='grid grid-cols-4  border border-white w-full gap-2'>
                                <div className='border flex flex-col  border-white col-span-2 '>
                                    <h1 className='font-mono mx-auto border-b border-green-600'>Outbound Flights</h1>
                                    {content[0].message.flightAgent.outboundFlights.map((item, index) => (
                                        <div key={index} className='flex flex-col border-t mt-2 border-b border-white'>
                                            <div className='flex justify-between items-center px-3 mt-5 '>
                                                <p className='text-sm'>Rank: {item.rank}</p>
                                                <p className='text-sm'>Time: {item.duration}</p>
                                                <p className='text-sm'>Stops: {item.stops}</p>

                                            </div>
                                            <h1 className='mx-auto mt-5 font-semibold text-lg bg-linear-to-r from-purple-400 via-red-400 to-yellow-400 bg-clip-text text-transparent border-b border-white  '>{item.airline}</h1>
                                            <div className='flex justify-between items-center px-5 mt-5'>
                                                <p className='bg-yellow-400/90 max-w-fit p-2 font-semibold rounded-md'>{item.route}</p>
                                                <p className='bg-green-400/90 max-w-fit text-slate-800 p-2 font-semibold rounded-md'>$ {item.price}</p>
                                            </div>

                                            <div className='flex justify-between items-center px-5 mt-10 mb-5'>
                                                <p className='flex  justify-center items-center text-sm border-dashed border p-2 rounded-md border-yellow-400'><Flame className='text-yellow-300 mr-2' />{item.recommendation}</p>
                                                <motion.a
                                                    whileTap={{ scale: 0.8 }}
                                                    whileHover={{ scale: 1.09 }}
                                                    target="_blank"
                                                    rel="noopener noreferrer" href={`${item.bookingLink}`}
                                                    className='flex cursor-pointer border-b border-white py-1 text-sm'>Buy Ticket <ExternalLink className='ml-3 h-[20px] w-[20px]' strokeWidth={1.2} /></motion.a>
                                            </div>
                                        </div>
                                    ))}
                                </div>


                                <div className='flex flex-col border px-2 border-white col-span-2 '>
                                    <h1 className='font-mono mx-auto border-b border-yellow-600'>Return Flights</h1>
                                    {content[0].message.flightAgent.returnFlights.map((item, index) => (
                                        <div key={index}>
                                            2
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                    </div>}
            </div>
            {/* Bottom textArea */}
            <div className='fixed   px-2 py-10 h-[130px] max-w-3xl w-full  bottom-[7px] flex justify-center backdrop-blur-sm  items-center'>
                <textarea id='chat'
                    rows={4}
                    autoFocus
                    onChange={(e) => setUserMessage(e.target.value)}
                    value={userMessage}
                    className=' px-2 resize-none py-1 border-2 w-full rounded-md border-white' />
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    whileHover={{ scale: 1.2 }} disabled={loading} className='ml-5  p-2 cursor-pointer ' onClick={handleCLick}> <CircleArrowUp className='text-white h-[50px] w-[30px]' /></motion.button>

            </div>
        </div>


    )
}

export default ChatUi