import { CircleArrowUp, ExternalLink, Flame, Focus, Lightbulb, PlaneLanding, PlaneTakeoff, Plus, Star, Menu, PanelRightClose, PanelRightOpen, MoveLeft, Bot } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { motion } from "framer-motion"
import { authClient } from '../lib/auth-client';
import AirplanePath from '../assets/arrow.svg?react'
import EmblaCarousel from './Carousel/EmblaCarousel';
import { useNavigate, useParams } from 'react-router-dom';
import Logout from './Logout';
import Sidebar from './Sidebar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../components/ui/accordion"
import Markdown from 'react-markdown'
import ReactJson from 'react-json-view'
import AccordionMenue from './Accordion';

function Chat() {
    const { chatId } = useParams()
    const [data, setData] = useState()
    const dataRef = useRef(chatId)
    const [error, setError] = useState()
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState([])
    const [photoUrl, setPhotoUrl] = useState([])
    const [dbUserId, setdbUserId] = useState()
    const [sideBar, setSideBar] = useState(false)
    const [update, setUpdate] = useState([])

    const { data: session } = authClient.useSession()
    const userId = session?.user?.id
    const navigate = useNavigate()


    async function handleChatHistory() {
        try {
            setLoading(true)
            const response = await fetch(`http://localhost:4001/api/chathistory/${chatId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'


            })

            if (!response.ok) {
                setLoading(false)
                return setError(response.error)
            }

            const result = await response.json()
            setData(result)
            setContent(result.message.content)
            setPhotoUrl(result.message.photoUrl)
            setdbUserId(result.message.userId)
            setUpdate(result.message.update)
            console.log(result)
            console.log("userdb:", result.message.userId)
            console.log("loggedinuser:", userId)
            setLoading(false)



        } catch (error) {
            setLoading(false)
            setError("Internal Server Error")
        }
    }


    useEffect(() => {

        handleChatHistory()
    }, [chatId])

    function hotelButton(name, location) {
        window.open(`https://www.google.com/search?q=Hotel ["${name.toLowerCase()}"] located at ["${location.toLowerCase()}"]`, "_blank")
    }

    // New Chat Id
    if (!chatId) return navigate('/')


    if (error) return (
        <div className="min-h-screen flex justify-center items-center w-full relative">
            {/* Radial Gradient Background from Top */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: "radial-gradient(125% 125% at 50% 10%, #9b9b88 40%, #475569 100%)",
                }}
            />
            <div className='min-h-screen text-3xl font-bold text-red-600 flex justify-center items-center'>
                <p>{error}</p>
            </div>
        </div>

    )

    if (userId !== dbUserId) return (

        <div className="min-h-screen flex justify-center items-center w-full relative">
            {/* Radial Gradient Background from Top */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: "radial-gradient(125% 125% at 50% 10%, #9b9b88 40%, #475569 100%)",
                }}
            />

            <div className="min-h-screen fixed z-10 m-auto min-w-3/4  flex flex-col justify-center items-center  px-5">
                <div className="bg-white shadow-xl rounded-xl p-10 border  border-gray-200 text-center max-w-lg w-full">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">
                        Access Denied
                    </h1>

                    <p className="text-gray-700 mb-6 text-lg">
                        You don’t have permission to view this chat.
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="py-2 cursor-pointer px-6 bg-emerald-600 hover:bg-emerald-700 
                       transition-colors text-white font-medium 
                       rounded-md shadow-md"
                    >
                        Go to Home Page
                    </button>
                </div>
            </div>

        </div>


    )


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

                    <div className='flex flex-col'>

                        {/* Top Accordion */}

                        {update &&
                            <div className='w-full mt-[20px]   '>
                                <Accordion type="single" className='border border-white bg-black/90 rounded-sm p-2 cursor-pointer' collapsible>
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger className="text-white flex justify-center items-center cursor-pointer text-lg font-semibold">Agentic Work Flow<span className="text-white/50 font-extralight text-sm">Click to expand / close</span></AccordionTrigger>
                                        <AccordionContent className="text-white text-white/50 max-h-[500px] overflow-y-auto ">
                                            <div className='bg-black/20'>

                                                {update &&
                                                    <div className='flex flex-col border-l-5 border-dashed border-yellow-400 gap mx-5 px-7  bg-black/50  '>


                                                        {update.filter((item) => item.agent != "Daily Activity Agent" && item.agent != "Flight Generation Agent" && item.agent != "Hotel Finder Agent")
                                                            .map((item, index, arr) => {
                                                                const prev = arr[index - 1];
                                                                const agentChanged = !prev || prev.agent !== item.agent;
                                                                return (<div className={`mr-auto relative w-full bg-black/50    p-3  flex flex-col ${agentChanged ? 'mt-5' : ''}`} key={index}>
                                                                    <div className={`absolute top-0 left-0 translate-x-[-25px] ${item.type === 'input' ? '' : 'hidden'}`}  >🟡</div>
                                                                    <h1 className={`text-white flex font-bold text-xl ${item.type === 'input' ? '' : 'hidden'}`}><Bot className='mr-5' />Agent: {item?.agent}</h1>
                                                                    {item.type === 'input' ? (<p className={` mt-5 flex  whitespace-pre-wrap font-extralight text-sm ${item.type === 'input' ? 'animate-pulse text-white' : 'text-white/50'}`}>Task: {typeof item?.message === 'object' ? JSON.stringify(item.message, null, 2) : item?.message}</p>) : (<AccordionMenue message={item.message} title={"Output of " + item.agent} />)}
                                                                </div>)

                                                            })
                                                        }


                                                        {update.filter((item) => item.agent == "Daily Activity Agent")
                                                            .map((item, index, arr) => {
                                                                const prev = arr[index - 1];
                                                                const agentChanged = !prev || prev.agent !== item.agent;
                                                                return (<div className={`mr-auto relative w-full bg-black/50    p-3  flex flex-col ${agentChanged ? 'mt-5' : ''}`} key={index}>
                                                                    <div className={`absolute top-0 left-0 translate-x-[-25px] ${item.type === 'input' ? '' : 'hidden'}`}  >🟡</div>
                                                                    <h1 className={`text-white flex font-bold text-xl ${item.type === 'input' ? '' : 'hidden'}`}><Bot className='mr-5' />Agent: {item?.agent}</h1>
                                                                    {item.type === 'input' ? (<p className={` mt-5 flex  whitespace-pre-wrap font-extralight text-sm ${item.type === 'input' ? 'animate-pulse text-white' : 'text-white/50'}`}>Task: {typeof item?.message === 'object' ? JSON.stringify(item.message, null, 2) : item?.message}</p>) : (<AccordionMenue message={item.message} title={"Output of " + item.agent} />)}
                                                                </div>)

                                                            })
                                                        }

                                                        {update.filter((item) => item.agent == "Hotel Finder Agent")
                                                            .map((item, index, arr) => {
                                                                const prev = arr[index - 1];
                                                                const agentChanged = !prev || prev.agent !== item.agent;
                                                                return (<div className={`mr-auto relative w-full bg-black/50    p-3  flex flex-col ${agentChanged ? 'mt-5' : ''}`} key={index}>
                                                                    <div className={`absolute top-0 left-0 translate-x-[-25px] ${item.type === 'input' ? '' : 'hidden'}`}  >🟡</div>
                                                                    <h1 className={`text-white flex font-bold text-xl ${item.type === 'input' ? '' : 'hidden'}`}><Bot className='mr-5' />Agent: {item?.agent}</h1>
                                                                    {item.type === 'input' ? (<p className={` mt-5 flex  whitespace-pre-wrap font-extralight text-sm ${item.type === 'input' ? 'animate-pulse text-white' : 'text-white/50'}`}>Task: {typeof item?.message === 'object' ? JSON.stringify(item.message, null, 2) : item?.message}</p>) : (<AccordionMenue message={item.message} title={"Output of " + item.agent} />)}
                                                                </div>)

                                                            })
                                                        }

                                                        {update.filter((item) => item.agent == "Flight Generation Agent")
                                                            .map((item, index, arr) => {
                                                                const prev = arr[index - 1];
                                                                const agentChanged = !prev || prev.agent !== item.agent;
                                                                return (<div className={`mr-auto relative w-full bg-black/50    p-3  flex flex-col ${agentChanged ? 'mt-5' : ''}`} key={index}>
                                                                    <div className={`absolute top-0 left-0 translate-x-[-25px] ${item.type === 'input' ? '' : 'hidden'}`}  >🟡</div>
                                                                    <h1 className={`text-white flex font-bold text-xl ${item.type === 'input' ? '' : 'hidden'}`}><Bot className='mr-5' />Agent: {item?.agent}</h1>
                                                                    {item.type === 'input' ? (<p className={` mt-5 flex  whitespace-pre-wrap font-extralight text-sm ${item.type === 'input' ? 'animate-pulse text-white' : 'text-white/50'}`}>Task: {typeof item?.message === 'object' ? JSON.stringify(item.message, null, 2) : item?.message}</p>) : (<AccordionMenue message={item.message} title={"Output of " + item.agent} />)}
                                                                </div>)

                                                            })
                                                        }





                                                    </div>}

                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        }

                        <div className='flex  justify-center  items-center  bg-black/50  '>
                            {/* ChatBox */}
                            {data &&
                                <div className='text-white w-full px-5 pb-10'>
                                    <button onClick={() => navigate('/')} className=' flex gap-2 items-center font-bold text-black/50 hover:text-black justify-center fixed top-5 z-50 left-1/2  -translate-x-1/2   bg-emerald-600 rounded-md px-2 py-1 cursor-pointer ' ><MoveLeft />Home</button>
                                    <div className='flex flex-col bg- px-3 py-2 rounded-md  items-center mt-5 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-50 via-orange-100 to-stone-500 border-b border-white'>
                                        <h1 className='border-b text-xl font-mono'>
                                            <span className='mr-2'>Title:</span>
                                            {content?.[0]?.message?.planOutline?.tripSummary}
                                        </h1>

                                        <p className='mt-2 text-sm font-light'>
                                            <span className='font-semibold border-b border-green-600'>Start:</span>
                                            {content?.[0]?.message?.trip?.startingLocation}

                                            {" | "}

                                            <span className='font-semibold border-b border-yellow-600'>Destination:</span>
                                            {content?.[0]?.message?.trip?.destination}

                                            {" | "}

                                            <span className='font-semibold border-b border-red-600'>From</span>
                                            [ {content?.[0]?.message?.trip?.startDate} ]

                                            <span className='font-semibold border-b border-red-600'>To</span>
                                            [ {content?.[0]?.message?.trip?.endDate} ]
                                        </p>
                                    </div>

                                    {/* Flight Info */}
                                    <div className='mt-[50px] pt-[15px] border-t border-white flex flex-col justify-center items-center'>
                                        <h1 className='font-mono text-xl border-b border-white'>Flight Information</h1>

                                        <div className='flex justify-center gap-10 items-center'>
                                            <PlaneTakeoff className='mr-2' />

                                            <p className='font-semibold border-b border-green-600'>
                                                {content?.[0]?.message?.flightAgent?.route?.origin?.city},
                                                {content?.[0]?.message?.flightAgent?.route?.origin?.country}
                                            </p>

                                            <AirplanePath className='text-white w-[100px] h-[120px]' />

                                            <p className='font-semibold border-b border-yellow-600'>
                                                {content?.[0]?.message?.flightAgent?.route?.destination?.city},
                                                {content?.[0]?.message?.flightAgent?.route?.destination?.country}
                                            </p>

                                            <PlaneLanding className='mr-2' />
                                        </div>

                                        <div className='grid grid-cols-4 border border-white w-full gap-2'>
                                            {/* Outbound */}
                                            <div className='border flex flex-col border-white col-span-2'>
                                                <h1 className='font-mono mx-auto border-b border-green-600'>Outbound Flights</h1>

                                                {content?.[0]?.message?.flightAgent?.outboundFlights?.map((item, index) => (
                                                    <div key={index} className='flex hover:bg-black/30 flex-col border-t mt-2 border-b border-white'>
                                                        <div className='flex justify-between items-center px-3 mt-5'>
                                                            <p className='text-sm'>Rank: {item?.rank}</p>
                                                            <p className='text-sm'>Time: {item?.duration}</p>
                                                            <p className='text-sm'>Stops: {item?.stops}</p>
                                                        </div>

                                                        <h1 className='mx-auto mt-5 font-semibold text-lg bg-gradient-to-r from-slate-100 to-yellow-100 bg-clip-text text-transparent border-b border-white'>
                                                            {item?.airline}
                                                        </h1>

                                                        <div className='flex justify-between items-center px-5 mt-5'>
                                                            <p className='bg-yellow-400/90 text-black max-w-fit p-2 font-semibold rounded-md'>{item?.route}</p>
                                                            <p className='bg-green-400/90 max-w-fit text-slate-800 p-2 font-mono rounded-md'>$ {item?.price}</p>
                                                        </div>

                                                        <div className='flex justify-between items-center px-5 mt-10 mb-5'>
                                                            <p className='flex justify-center items-center text-sm border-dashed border p-2 rounded-md border-yellow-400'>
                                                                <Flame className='text-yellow-300 mr-2' />
                                                                {item?.recommendation || "Best Option"}
                                                            </p>

                                                            <motion.a
                                                                whileTap={{ scale: 0.8 }}
                                                                whileHover={{ scale: 1.09 }}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                href={`${item?.bookingLink}`}
                                                                className='flex cursor-pointer border-b border-white py-1 text-sm'
                                                            >
                                                                Buy Ticket <ExternalLink className='ml-3 h-[20px] w-[20px]' />
                                                            </motion.a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Return Flights */}
                                            <div className='border flex flex-col border-white col-span-2'>
                                                <h1 className='font-mono mx-auto border-b border-yellow-600'>Return Flights</h1>

                                                {content?.[0]?.message?.flightAgent?.returnFlights?.map((item, index) => (
                                                    <div key={index} className='flex hover:bg-black/30 flex-col border-t mt-2 border-b border-white'>
                                                        <div className='flex justify-between items-center px-3 mt-5'>
                                                            <p className='text-sm'>Rank: {item?.rank}</p>
                                                            <p className='text-sm'>Time: {item?.duration}</p>
                                                            <p className='text-sm'>Stops: {item?.stops}</p>
                                                        </div>

                                                        <h1 className='mx-auto mt-5 font-semibold text-lg bg-gradient-to-r from-slate-100 to-yellow-100 bg-clip-text text-transparent border-b border-white'>
                                                            {item?.airline}
                                                        </h1>

                                                        <div className='flex justify-between items-center px-5 mt-5'>
                                                            <p className='bg-yellow-400/90 text-black max-w-fit p-2 font-semibold rounded-md'>{item?.route}</p>
                                                            <p className='bg-green-400/90 text-slate-800 p-2 font-mono rounded-md'>$ {item?.price}</p>
                                                        </div>

                                                        <div className='flex justify-between items-center px-5 mt-10 mb-5'>
                                                            <p className='flex justify-center items-center text-sm border-dashed border p-2 rounded-md border-yellow-400'>
                                                                <Flame className='text-yellow-300 mr-2' />
                                                                {item?.recommendation || "Best Option"}
                                                            </p>

                                                            <motion.a
                                                                whileTap={{ scale: 0.8 }}
                                                                whileHover={{ scale: 1.09 }}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                href={`${item?.bookingLink}`}
                                                                className='flex cursor-pointer border-b border-white py-1 text-sm'
                                                            >
                                                                Buy Ticket <ExternalLink className='ml-3 h-[20px] w-[20px]' />
                                                            </motion.a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gallery */}
                                    <div className='mt-[100px] flex flex-col border-t border-white justify-center items-center'>
                                        <h1 className='border-b border-white text-xl mb-[30px] mt-[20px]'>Gallery</h1>

                                        {photoUrl?.length > 0 && (
                                            <div className='p-5 bg-black/50 rounded-lg'>
                                                <EmblaCarousel slides={photoUrl} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Daily Activity */}
                                    <div className='mt-[50px] pt-[15px] border-t border-white flex flex-col justify-center items-center'>
                                        <h1 className='font-mono text-xl border-b border-white mb-[30px]'>Daily Activities</h1>

                                        {content?.[0]?.message?.dailyActivity?.days?.map((item, index) => (
                                            <div key={item?.date} className='flex border-2 border-yellow-400/60 p-4 rounded-md flex-col mt-5 w-full'>
                                                <div className='mr-auto rounded-md mb-5 py-2 bg-[#DEDED1] px-5'>
                                                    <p className='text-black'><span className='border-b'>Day:</span> {item?.day}</p>
                                                    <p className='text-black mt-[5px]'><span className='border-b'>Date:</span> "{item?.date}"</p>
                                                </div>

                                                <h1 className='text-lg border-b border-[#FBF3D1] mb-5'>Title: <span className='font-bold'>{item?.title}</span></h1>

                                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'>
                                                    {item?.activities?.map((activity, actIndex) => (
                                                        <div key={actIndex} className='text-white hover:bg-black/40 flex flex-col border border-white p-3 rounded-md'>
                                                            <div className='mb-4'>
                                                                <p>Time: {activity?.time}</p>
                                                                <p className='mt-2'>Location: {activity?.location}</p>
                                                            </div>

                                                            <div className='flex flex-col h-full justify-between'>
                                                                <p className='bg-[#DEDED1] p-2 text-black rounded-sm mb-4'>{activity?.description}</p>

                                                                <div>
                                                                    <p className='mt-3 flex items-center'>
                                                                        <Focus strokeWidth={1.5} />
                                                                        <span className='ml-2 px-2 py-1 rounded-md bg-green-400/50'>{activity?.focusArea}</span>
                                                                    </p>

                                                                    <div className='flex mt-4 flex-col bg-[#F9F8F6] p-2 rounded-sm'>
                                                                        <p className='flex justify-center text-black font-bold'>TIPS<Lightbulb className='ml-2 text-yellow-400' /></p>
                                                                        <p className='mt-2 text-black text-sm'>{activity?.tips}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Hotels */}
                                    <div className='mt-[50px] w-full pt-[15px] border-t border-white flex flex-col justify-center items-center'>
                                        <h1 className='font-mono text-xl border-b mb-[30px] border-white'>Accommodation List</h1>

                                        {content?.[0]?.message?.hotelsGen?.hotels?.map((item, index) => (
                                            <div key={index} className='w-full relative rounded-md border-2 border-yellow-400/60 p-4 flex flex-col hover:bg-black/40 mt-5'>
                                                <div className='absolute top-3 right-3'>
                                                    <motion.button
                                                        onClick={() => hotelButton(item?.hotel?.name, item?.location)}
                                                        whileHover={{ scale: 1.05 }}
                                                        className='flex border-b border-white px-3 py-2'>
                                                        Visit Hotel <ExternalLink strokeWidth={1.5} className='h-[18px] w-[18px]' />
                                                    </motion.button>
                                                </div>

                                                <div className='flex flex-wrap gap-5 bg-[#DEDED1] rounded-md px-5 py-2 mr-auto mb-4'>
                                                    <p className='text-black'>Day: {item?.day}</p>
                                                    <p className='text-black'>Location: {item?.location}</p>
                                                </div>

                                                <div className='flex flex-wrap gap-5 items-center mb-4'>
                                                    <p className='border-b'><span className='font-bold'>Hotel:</span> {item?.hotel?.name}</p>
                                                    <p className='border-b'><span className='font-bold'>Per Night:</span> {item?.hotel?.pricePerNight || "N/A"}</p>

                                                    {item?.hotel?.rating && (
                                                        <p className='flex font-bold gap-2'>
                                                            <Star className='h-[20px] w-[20px]' />
                                                            {item?.hotel?.rating || "N/A"}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className='bg-[#F9F8F6] p-3 rounded-md'>
                                                    <p className='text-black'><span className='font-bold'>About:</span> {item?.hotel?.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            }
                        </div>
                        {/* Bottom textArea
            <div className='fixed px-2 py-10 bg-black/30 rounded-md h-[130px] max-w-7xl w-full  bottom-[7px] flex justify-center backdrop-blur-sm  items-center'>
                <textarea id='chat'
                    rows={4}
                    autoFocus
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder='You must provide [Source, Destination, No of trip days, Approximate budget, Starting Date etc] ...'
                    value={userMessage}
                    className=' px-2 text-white font-mono resize-none py-1 border-2 w-full rounded-md border-white' />
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    whileHover={{ scale: 1.2 }} className='ml-5  p-2 cursor-pointer ' onClick={handleCLick}> <CircleArrowUp className='text-white h-[50px] w-[30px]' /></motion.button>

            </div> */}
                    </div>
                </div>
            </div>

        </div >


    )
}

export default Chat