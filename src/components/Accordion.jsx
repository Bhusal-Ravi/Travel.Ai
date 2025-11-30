
import React from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion"
import Markdown from 'react-markdown'
import ReactJson from 'react-json-view'

function AccordionMenue({ title, message }) {
    return (
        <Accordion type="single" className='border border-white/20 rounded-lg p-2 cursor-pointer' collapsible>
            <AccordionItem value="item-1">
                <AccordionTrigger className="text-white cursor-pointer text-lg font-semibold">{title}</AccordionTrigger>
                <AccordionContent className="text-white text-white/50 max-h-[500px] overflow-y-auto ">
                    {typeof message === 'object' ? <ReactJson theme='marrakesh' className='p-2' src={message} /> : <Markdown>{message}</Markdown>}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

export default AccordionMenue 