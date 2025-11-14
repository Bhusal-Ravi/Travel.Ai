import { CircleArrowUp, ExternalLink, Flame, Focus, Lightbulb, LightbulbIcon, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"

import AirplanePath from '../assets/arrow.svg?react'
import EmblaCarousel from './Carousel/EmblaCarousel';


function ChatUi() {
    const [loading, setLoading] = useState(false)
    const [state, setState] = useState();
    const [content, setContent] = useState([])
    const [error, setError] = useState();
    const [userMessage, setUserMessage] = useState()
    const [location, setLocation] = useState()
    const [photoUrl, setPhotoUrl] = useState([])

    async function fetchState() {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:4001/api/userInput`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: `Plan me a trip to Japan, Iwant to visit as many unique places of japan as  possible, budget of about 1000$, trip of 5 days starting from tomorrow, I am leaving from Kathmandu Nepal`,
                    threadId: `user123`
                })
            })
            if (!response.ok) {
                setError(response.error)
            }

            const result = await response.json()

            setState(result)
            setLocation(result.output.message.locations.location)
            console.log(result)
            setContent((prev) => [...prev, { type: 'ai', message: result.output.message }])

            setLoading(false)
        } catch (error) { console.log(error) }
    }

    function handleCLick(e) {
        fetchState()

    }


    // PhotoFetch
    async function fetchPhotos() {
        try {
            const response = await fetch(`http://localhost:4001/api/photo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location: location })
            })
            const result = await response.json()
            console.log(result)
            const photo = result.message.map((item) => (
                item.map((url, index) => (
                    { "url": url.src.portrait, "name": url.alt }
                ))
            )).flat()

            setPhotoUrl(photo)

        } catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {
        console.log(location)
        fetchPhotos()

    }, [location])



    return (




        <div className='flex flex-col'>
            <div className='flex  justify-center  items-center  bg-black/50  '>
                {/* ChatBox */}
                {state &&
                    <div className='text-white w-full px-5   '>

                        <div className='flex flex-col bg- px-3 py-2 rounded-md  items-center mt-5 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-50 via-orange-100 to-stone-500 border-b border-white'>
                            <h1 className='border-b text-xl font-mono'><span className='mr-2'>Title:</span>{content[0].message.planOutline.tripSummary}</h1>
                            <p className='mt-2 text-sm font-light'><span className='font-semibold border-b border-green-600'>Start:</span> {content[0].message.trip?.startingLocation} | <span className='font-semibold border-b border-yellow-600'>Destination:</span> {content[0].message.trip?.destination} | <span className='font-semibold border-b border-red-600'>From</span> [ {content[0].message.trip?.startDate} ] <span className='font-semibold border-b border-red-600'>To</span> [ {content[0].message.trip?.endDate} ]   </p>
                        </div>
                        {/* Flight Information */}
                        <div className='mt-[50px] pt-[15px] border-t border-white  flex flex-col justify-center items-center'>
                            <h1 className='font-mono text-xl border-b border-white'>Flight Information</h1>
                            <div className='flex justify-center gap-10 items-center '>
                                <PlaneTakeoff className='mr-2' /><p className='font-semibold border-b border-green-600'>{content[0].message.flightAgent.route.origin?.city}, {content[0].message.flightAgent.route.origin?.country}</p>
                                <AirplanePath className='text-white  w-[100px] h-[120px]  ' />
                                <p className='font-semibold border-b border-yellow-600'>{content[0].message.flightAgent.route.destination?.city}, {content[0].message.flightAgent.route.destination?.country}</p><PlaneLanding className='mr-2' />
                            </div>


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
                                            <div></div>
                                            <h1 className='mx-auto mt-5 font-semibold text-lg bg-gradient-to-r from-slate-100 to-yellow-100 bg-clip-text text-transparent border-b border-white  '>{item.airline}</h1>
                                            <div className='flex justify-between items-center px-5 mt-5'>
                                                <p className='bg-yellow-400/90 text-black max-w-fit p-2 font-semibold rounded-md'>{item.route}</p>
                                                <p className='bg-green-400/90 max-w-fit text-slate-800 p-2 font-mono rounded-md'>$ {item.price}</p>
                                            </div>

                                            <div className='flex justify-between items-center px-5 mt-10 mb-5'>
                                                <p className='flex  justify-center items-center text-sm border-dashed border p-2 rounded-md border-yellow-400'><Flame className='text-yellow-300 mr-2' />{item.recommendation ? item.recommendation : "Best Option"}</p>
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


                                <div className='flex flex-col border  border-white col-span-2 '>
                                    <h1 className='font-mono mx-auto border-b border-yellow-600'>Return Flights</h1>
                                    {content[0].message.flightAgent.returnFlights.map((item, index) => (
                                        <div key={index} className='flex flex-col border-t mt-2 border-b border-white'>
                                            <div className='flex justify-between items-center px-3 mt-5 '>
                                                <p className='text-sm'>Rank: {item.rank}</p>
                                                <p className='text-sm'>Time: {item.duration}</p>
                                                <p className='text-sm'>Stops: {item.stops}</p>

                                            </div>
                                            <h1 className='mx-auto mt-5 font-semibold text-lg bg-gradient-to-r from-slate-100 to-yellow-100 bg-clip-text text-transparent border-b border-white  '>{item.airline}</h1>
                                            <div className='flex justify-between items-center px-5 mt-5'>
                                                <p className='bg-yellow-400/90 max-w-fit p-2 text-black font-semibold rounded-md'>{item.route}</p>
                                                <p className='bg-green-400/90 max-w-fit text-slate-800 p-2 font-mono rounded-md'>$ {item.price}</p>
                                            </div>

                                            <div className='flex justify-between items-center px-5 mt-10 mb-5'>
                                                <p className='flex  justify-center items-center text-sm border-dashed border p-2 rounded-md border-yellow-400'><Flame className='text-yellow-300 mr-2' />{item.recommendation ? item.recommendation : "Best Option"}</p>
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



                            </div>
                        </div>

                        {/* Photo Collection */}

                        <div className='mt-[100px] flex flex-col border-t border-white justify-center items-center   '>
                            <h1 className='border-b border-white text-xl mb-[30px] mt-[20px]'>Gallery</h1>
                            {photoUrl.length > 0 && (
                                <div className='p-5 bg-black/50 rounded-lg'>
                                    <EmblaCarousel slides={photoUrl} />
                                </div>)
                            }

                        </div>


                        {/* Daily Activity */}
                        <div className='mt-[50px] pt-[15px] border-t border-white  flex flex-col justify-center items-center'>
                            <h1 className='font-mono text-xl border-b border-white'>Daily Activities</h1>

                            {content[0].message.dailyActivity.days.map((item, index) => (
                                <div key={item.date} className='flex border-2 border-yellow-400/60  p-2 rounded-md flex-col mt-5 w-full  justify-center items-center'>
                                    <div className='mr-auto  rounded-md mb-5 py-1 bg-[#DEDED1] px-5'>
                                        <p className='text-black'><span className='border-b  border-[#000000]'>Day:</span> <span className='font-semibold text-slate-800'>{item.day}</span> </p>
                                        <p className='text-black mt-[5px]'><span className='border-b  border-[#000000]'>Date:</span> <span className='font-semibold text-slate-800'>"{item.date}"</span> </p>
                                    </div>
                                    <h1 className='text-lg border-b mt-2.5 border-[#FBF3D1]'>Title: <span className='font-bold text-lg'>{item.title}</span></h1>
                                    {/* Activities */}
                                    <div className='flex mt-5 mx-auto justify-between  '>
                                        {item.activities.map((activity, index) => (
                                            <div className='text-white  hover:bg-yellow-400/20 max-w-1/3 mx-2 flex flex-col    border p-2 rounded-sm'>
                                                <div>
                                                    <p ><span className='border-b border-[#FBF3D1]'>Time:</span> {activity.time}</p>
                                                    <p className='mt-[5px]'><span className='border-b border-[#FBF3D1]'>Location:</span> {activity.location}</p>
                                                </div>

                                                <div className='flex mt-5 flex-col h-full justify-between   '>

                                                    <p className='bg-[#DEDED1] p-1 text-black font-mono rounded-sm'>{activity.description}</p>
                                                    <div className='  cursor-pointer mt-[20px]'>
                                                        <p className='mt-3 relative flex group  items-center '><Focus strokeWidth={1.5} /><span className='ml-2 px-2 py-1 rounded-md  bg-green-400/50'>{activity.focusArea}</span> <p className='bg-black/60 absolute translate-x-3.5 -translate-y-9 invisible group-hover:visible  text-white p-2 rounded-md max-w-fit'>Focus Area</p></p>
                                                        <div className='flex mt-5 rounded-sm flex-col justify-center group relative bg-[#F9F8F6]'>
                                                            <p className='absolute invisible group-hover:visible translate-x-3.5 -translate-y-9 bg-black/50 px-3   text-white py-1 rounded-md max-w-fit '>Tips</p>
                                                            <p className='flex justify-center items-center mt-[2px] text-black font-bold'>TIPS<LightbulbIcon className='ml-2 text-yellow-400' /></p>
                                                            <p className='flex flex-col  rounded-sm mt-2'><span className='ml-3 px-2 py-1 rounded-md text-black  '>{activity.tips}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    </div>

                                </div>
                            ))}

                        </div>

                    </div>}
            </div>
            {/* Bottom textArea */}
            <div className='fixed px-2 py-10 bg-black/30 rounded-md h-[130px] max-w-7xl w-full  bottom-[7px] flex justify-center backdrop-blur-sm  items-center'>
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