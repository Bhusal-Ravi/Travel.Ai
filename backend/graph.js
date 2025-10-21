import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation, interrupt, Command } from "@langchain/langgraph";
import {z} from 'zod'
import dotenv from 'dotenv'
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, AIMessage, SystemMessage,ToolMessage } from "@langchain/core/messages";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

import { TavilySearch } from "@langchain/tavily";
import Database from 'better-sqlite3';




dotenv.config()

const db = new Database('trip.sqlite');






//Original LLM
const llm= new ChatGroq({
     model: "llama-3.3-70b-versatile",
     temperature:0.1
})





//State for the overall program
const state= Annotation.Root({
    input:Annotation(),
    trip:Annotation({
            default: ()=>({
            startingLocation:"",
            destination:"",
            startDate: "",
            endDate:"",
            budget: "",
            })
            
            
    }),
    validation:Annotation({
        default:()=>({
            condition:" ",
            missing:[],
            humanResponse:" "
        })
    }),

    toolCallMessage:Annotation(),

    planOutline:Annotation({
        default:()=>({
            tripSummary: "",
            start:"",
            end:"",
            startingLocation: "",
            destination: "",
            duration: "",
            budget: "",
            days: []
        })
    }),

    flightAgent:Annotation({
        default:()=>({
            
    searchQuery: "",
    searchDate: "",
    route: {},
  
  // OUTBOUND FLIGHTS
  outboundFlights: [],
  
  // RETURN FLIGHTS
  returnFlights: [],
  
 
  
        })
    }),

    dailyActivity: Annotation({
  default: () => ([
    {
      day: "",
      date: "",
      activities: [
        {
          time: "",
          title: "",
          description: "",
          location: "",
          focusArea: "",
          tips: ""
        }
      ]
    }
  ])
})
    

})

//Structured State for userInput formatting
const inputState= z.object({
    startingLocation:z.string().describe('place where the user is currently planning the trip from'),
    destination:z.string().describe("place where the person is willing to go"),
    startDate:z.string().describe('Start date for the travel'),
    endDate:z.string().describe('End date of the trip'),
    budget:z.string().describe('Total available budjet for the trip')
    
})

//Llm with structured output for userInput

const userInputLlm= llm.withStructuredOutput(inputState)



 const config={"configurable": {"thread_id": '2'}}
const checkPointer = new SqliteSaver(db);



 // userInput function is used to extract the data provided by user in a structured format based on the userInputLlm
 async function userInput(state){
    try{
        const {input,trip,validation}= state;
        const humanResponse=validation?.humanResponse || ""
        const inputMessage= input + humanResponse
        const messages=[
            {
                role:`user`,
                content:`${inputMessage}`
            },
            {
                role:`system`,
                content:`You are a part of a travel planner. Your job is to receive the input of the user and provide a structured output from the users input.
                          You need to extract  {startingLocation: ,destination: , startDate: , endDate : , budget:  } from the users input. If the users input does not provide adequate information you do not add random values, Make the remaining field empty
                          
                          for example:[ example1=>(user:Plan me a trip to Tokyo 
                                        your output : {startingLocation:"", destination:"Tokyo",startDate:"" , endDate :"" , budget:"")})

                                        example2=>(user:Plan me a trip with destination: 'Tokyo' from Nepal,
                                                    startDate: 'Sun Oct 20 2025',
                                                    endDate: 'Sun Oct 27 2025',
                                                    budget: '1000'
                                                    your output: {startingLocation: 'Nepal'
                                                                destination: 'Tokyo',
                                                                startDate: 'Sun Oct 20 2025',
                                                                endDate: 'Sun Oct 27 2025',
                                                                budget: '1000'})
                                                                                    ]
                            Today's date: ${new Date().toDateString()}
                          `
            }

        ]

        const response= await userInputLlm.invoke(messages)
        

        return {trip:response}

    }catch(error){
        console.log(error)
    }
 }


 // validate() function is used to validate weather the user has provided proper information or not 
async function validate(state){
        const {trip}= state
        const fields=['startingLocation','destination','startDate','endDate','budget']
        const missingFields= fields.filter(item=>trip[item]==='')
        
        
            if(missingFields.length>0){
                const humanResponse= interrupt(`Please enter the missing Fields: [ ${missingFields.map(item=>item.toUpperCase() ,)}]`)
                const output={condition:'interrupted',missing: missingFields, humanResponse:humanResponse}   
                return {validation:output}
            }else {
                const output={condition:'completed',missing: missingFields, humanResponse:""}
                return { validation: output }; 
            }
       
}

// the check() is a conditionalEdge from the validate , that says weather to go the next node or return to the userInput to reconsider the input from users
async function check(state){
        const {validation,humanResponse}=state
        const {condition,missing}=validation
        

        if(condition==='interrupted') return "userInput"
         return  'webTool'}






//webSearch tool execute
async function webSearch(state){
    const {toolCallMessage,input,trip}=state
    const {startDate,startingLocation,endDate,destination,budget}=trip

    const tool = new TavilySearch({ maxResults: 5, topic: 'general' });
    const webSearchLlm = llm.bindTools([tool]);
 
     
    const message=[new HumanMessage(`Find travel information for a trip from ${startingLocation} to ${destination} between ${startDate} and ${endDate} with a budget of ${budget}. Focus on: attractions, things to do, best places to visit, local tips, and travel recommendations.`),
        new SystemMessage(`You are a travel planning assistant with access to web search. 
            Use the tavily_search_results_json tool to find current, relevant travel information.
            Generate a comprehensive search query that will return useful travel planning information.`),]

    

    try{
        //invoking the llm to generate the query for searching
    const webResponse= await webSearchLlm.invoke(message)

   
    const toolCallArgs=webResponse.tool_calls[0]

    

    //invoking the tavily api to search the web to find relevant information
    const toolCallResponse= await tool.invoke(toolCallArgs)

    
    const toolMessage=new ToolMessage({
        content:toolCallResponse.content,
        name:toolCallResponse.name,
        tool_call_id:toolCallResponse.tool_call_id

    })





    //invoking the llm again to generate or summarize all the information that is received from the web and according to the users need
    
    const finalMessage=[new SystemMessage(`You are a Travel Information Synthesizer, a critical component in a travel planning pipeline.

## Your Role

You receive raw web search results about a destination and your job is to analyze, extract, and summarize the most relevant travel information in a structured, actionable format. Your output will be used by a Trip Planner Agent to create detailed day-by-day itineraries.

## Context You'll Receive

1. **User's Original Request** - Their trip requirements (destination, dates, budget, preferences)
2. **Search Query** - The query that was used to find information
3. **Search Results** - Multiple web sources with information about the destination

## Your Task

Analyze the search results and create a comprehensive travel information summary that includes:

### 1. **Destination Overview**
   - Brief description of the destination
   - Best time to visit (especially relevant to their travel dates)
   - General vibe and what the place is known for

### 2. **Key Attractions & Activities**
   - Top must-see attractions (prioritize based on popularity/score in results)
   - Unique experiences specific to this destination
   - Cultural sites, museums, parks, landmarks
   - Activities grouped by type (cultural, adventure, relaxation, food, nightlife)

### 3. **Practical Information**
   - Transportation options within the destination
   - Popular neighborhoods to explore
   - Local tips and insider knowledge from the sources

### 4. **Budget Considerations**
   - Flight price ranges mentioned (if any)
   - Activity costs found in the results
   - General expense levels (budget-friendly options vs premium experiences)

### 5. **Timing & Logistics**
   - How long to spend at major attractions
   - Best days/times to visit certain places
   - Day trip options from the main destination

### 6. **Seasonal & Event Information**
   - Any festivals, events, or seasonal highlights during their travel dates
   - Weather considerations
   - Seasonal attractions (e.g., cherry blossoms, autumn foliage)

## Output Format

Structure your summary in clear sections with bullet points for easy scanning. Be concise but comprehensive. Focus on actionable information that a trip planner can use.

**Example format:**
\`\`\`
DESTINATION OVERVIEW
Tokyo is Japan's bustling capital, blending ultramodern with traditional...

KEY ATTRACTIONS
Must-See Sites:
• Sensoji Temple (Asakusa) - Ancient Buddhist temple, iconic landmark
• Meiji Shrine - Peaceful Shinto shrine in forested grounds
• Shibuya Crossing - World's busiest intersection, iconic photo spot

Cultural Experiences:
• Ghibli Museum - Animation museum, requires advance booking (1000 yen)
• Kabuki Theatre - Traditional Japanese performance art
• Tsukiji Outer Market - Fresh seafood and local food culture

NEIGHBORHOODS TO EXPLORE
• Shinjuku - Skyscrapers, shopping, nightlife
• Harajuku - Youth culture, fashion, trendy cafes
• Akihabara - Electronics, anime, otaku culture
...
\`\`\`

## Critical Guidelines

1. **Prioritize by Relevance** - Use the score field in search results to identify most relevant information
2. **Extract Specifics** - Include specific names, prices, locations, and timing when available
3. **Remove Redundancy** - If multiple sources say the same thing, mention it once
4. **Flag Important Details** - Highlight things that need advance booking, specific timing, or special considerations
5. **Be Honest About Gaps** - If search results don't cover something (e.g., accommodation), note it
6. **Budget Awareness** - Consider the user's budget when highlighting options
7. **Date Relevance** - Pay special attention to seasonal information matching their travel dates

## What NOT to Do

❌ Don't create a day-by-day itinerary (that's the Planner Agent's job)
❌ Don't invent information not present in the search results
❌ Don't include promotional language or fluff
❌ Don't repeat the same information multiple times
❌ Don't include broken or incomplete information from truncated results

## Quality Checklist

Before finalizing your summary, ensure:
✓ All major attractions mentioned in results are included
✓ Practical details (costs, timing, booking requirements) are captured
✓ Information is organized logically by category
✓ The summary is scannable and easy to reference
✓ Budget-relevant information is highlighted
✓ Seasonal/date-specific information is noted

Remember: Your output is the foundation for creating an amazing trip. Be thorough, accurate, and well-organized.`),
 new HumanMessage(`Find travel information for a trip from ${startingLocation} to ${destination} between ${startDate} and ${endDate} with a budget of ${budget}. Focus on: attractions, things to do, best places to visit, local tips, and travel recommendations.`),
webResponse,        
toolMessage,
new HumanMessage(`Now analyze the search results above and provide a comprehensive travel information summary following the format and guidelines in your system instructions.`)
]

    const finalResponse= await llm.invoke(finalMessage)

   return {toolCallMessage:finalResponse.content}

    }catch(error){console.log(error)}

}


//planOutline structured format
    const planOutlineStructure= z.object({
        
  tripSummary: z.string().describe('Very Short summary for the given trip'),
  start:z.string().describe('Starting date of the trip'),
  end:z.string().describe('Ending date of the trip'),
  startingLocation: z.string().describe('Country where the user is currently located'),
  destination: z.string().describe('Country where the trip is happening'),
  duration: z.union([z.string(), z.number()]).describe('No of days of the trip'),
  budget: z.string().describe('The estimated budjet of the user'),
  days: z.array(
    
    z.object({
                     day: z.union([z.string(), z.number()]).describe('Which day of the trip is currently is'),
                     date:z.string().describe('Date of the current day'),
                    title: z.string().describe('title for the current day of the trip'),
                    description: z.string().describe('Short description of what will happen in this day'),
                    focusArea: z.string().describe('HighLight of the day')
                }))
  
    })

    //Making the llm equiped with the planOutlineStructre
    const planOutlineLlm= llm.withStructuredOutput(planOutlineStructure)
    



    //planOutlineGen is used to generate a high level plan for the specific trip, has the ability to websearch as well
async function planOutlineGen(state){
    
    const {trip,input,toolCallMessage}=state
    const {startingLocation, destination,startDate,endDate,budget}=trip


    const message= [
        new HumanMessage(`User has asked for this request: [${input}].Prepare a high Level outline for the trip with these details : ["startingLocation":${startingLocation}, "destination": ${destination}, "startDate": ${startDate}, "endDate": ${endDate}, "budget": ${budget}].Available necessary information of the destination: [${toolCallMessage}] `),

        new SystemMessage(`You are a professional travel planner AI assistant.

Your task: Create a [high-level trip outline] for the user based on their provided trip information.

Focus on producing a logical, day-by-day structure** that will later be expanded by other specialized nodes (like accommodation, activities, transportation, etc.).

You are equipped with webSearch tools, so Search for proper information in the web to find out about the major attractions, things to do , fun activities etc. So that you can plan your outline properly

### Rules
1. Keep the plan **chronologically structured** by days.
2. Each day should have a **title** and a short **description** of the main activities or goals.
3. Do not include specific restaurant, hotel, or booking details — only the general flow.
4. The tone should be friendly, organized, and realistic.`)
    ]

    try{
        const response= await planOutlineLlm.invoke(message)

      

        return { planOutline:response}
    }catch(error){
        console.log(error)
    }

}


//FlightGen structuredOutput setup
const flightGenStructure =  z.object({
    

   route: z.object({
    origin: z.object({
      city: z.string().describe("City of departure"),
      country: z.string().describe("Country of departure"),
      airportCode: z.string().describe("IATA code of origin airport (e.g., KTM)"),
      airportName: z.string().describe("Full name of origin airport")
    }).describe("Origin airport details"),

    destination: z.object({
      city: z.string().describe("Destination city"),
      country: z.string().describe("Destination country"),
      airportCode: z.string().describe("IATA code of destination airport (e.g., NRT/HND)"),
      airportName: z.string().describe("Full name of destination airport")
    }).describe("Destination airport details")
  }).describe("Flight route information"), 


  startDate: z.string().describe("Trip starting date (YYYY-MM-DD or human-readable)"),
  endDate: z.string().describe("Trip return date (YYYY-MM-DD or human-readable)"),

  outboundFlights: z.array(
    z.object({
      rank: z.number().describe("Rank or priority of the flight option"),
      airline: z.string().describe("Airline name"),
      route: z.string().describe("Route description (e.g., KTM → NRT)"),
      duration: z.string().describe("Total travel duration"),
      stops: z.number().describe("Number of stops (0 = direct)"),
      price: z.number().describe("Flight price in USD"),
      recommendation: z.string().optional().describe("Label such as 'Best Value' or 'Fastest'"),
      bookingLink: z.string().url().optional().describe("Booking page URL if available")
    })
  ).describe("List of outbound flight options"),

  returnFlights: z.array(
    z.object({
      rank: z.number().describe("Rank or priority of the flight option"),
      airline: z.string().describe("Airline name"),
      route: z.string().describe("Route description (e.g., NRT → KTM)"),
      duration: z.string().describe("Total travel duration"),
      stops: z.number().describe("Number of stops (0 = direct)"),
      price: z.number().describe("Flight price in USD"),
      recommendation: z.string().optional().describe("Label such as 'Best Value' or 'Fastest'"),
      bookingLink: z.string().url().optional().describe("Booking page URL if available")
    })
  ).describe("List of return flight options")
});



const flightToolStructured=llm.withStructuredOutput(flightGenStructure)

async function flightGen(state){
    try{
        const{trip,planOutline}=state
        const { tripSummary,start,end,startingLocation,destination,duration,budget,days}= planOutline


        const tool = new TavilySearch({ maxResults: 5, topic: 'general' });
    const flightToolLlm = llm.bindTools([tool]);

        const messages=[new SystemMessage(`You are a agent which is responsible for generating a query , to find the available flight according to the given input from user. You are equiped with webSearch tool and should always use this tool to generate query`),
            new HumanMessage(`For a travel plan ,Find out the available flight: Both outbound and return flights  [from:${startingLocation}, to: ${destination}, startingDate: ${start}, endingDate: ${end}, tripSummary:${tripSummary}`)]
        
        const queryLlm= await flightToolLlm.invoke(messages)

        const toolCallArgs=queryLlm.tool_calls[0]

        const toolCallResponse= await tool.invoke(toolCallArgs) 

         const toolMessage=new ToolMessage({
        content:toolCallResponse.content,
        name:toolCallResponse.name,
        tool_call_id:toolCallResponse.tool_call_id

    })

    const finalMessage=[new SystemMessage(`You are a specialized Flight Search and Aggregation Agent, designed to collect, analyze, and return detailed flight information for a given route and travel dates.
You ar eprovided with web search result from various flight data sources to find the most relevant outbound and return flights for a travele's itinerary. You are not a conversational agent — your only purpose is to return structured, factual, and consistent flight data.

🎯 Core Responsibilities

Interpret the use's travel intent and extract:

Origin city and airport

Destination city and airport

Start date (departure date)

Return date (arrival back date)



Rank flight options based on:

Shortest duration

Best balance between price and convenience (e.g., minimal layovers)

Popular or reliable airlines

Return the information in the required schema only — with no extra commentary, explanations, or natural language descriptions.`),

new HumanMessage(`For a travel plan ,Find out the available flight: Both outbound and return flights  [from:${startingLocation}, to: ${destination}, startingDate: ${start}, endingDate: ${end}, tripSummary:${tripSummary}`),

queryLlm,
toolMessage,
new HumanMessage(`With the available information provide a structured output for the fligt : tripSummary:[${tripSummary}`)
]

const finalResponse=await flightToolStructured.invoke(finalMessage)
console.log(finalResponse)






    }catch(error){
        console.log(error)
    }
}


const dailyActivityTripStructure = z.array(
  z.object({
    day: z.union([z.string(), z.number()]).describe("Day number of the trip"),
    date: z.string().describe("Date of the current day"),
    activities: z.array(
      z.object({
        time: z.string().describe("Approximate time (morning, afternoon, evening)"),
        title: z.string().describe("Title of the activity"),
        description: z.string().describe("Detailed description of what to do"),
        location: z.string().optional().describe("Specific location or area"),
        focusArea: z.string().describe("Highlight or purpose of the activity (culture, sightseeing, trekking, etc.)"),
        tips: z.string().optional().describe("Local tips, travel advice or warnings")
      })
    ).describe("List of activities for the day")
  })
).describe("Daily activities for the entire trip");

const dailyActivityLlm= llm.withStructuredOutput(dailyActivityTripStructure)

async function dailyActivityGen(state){
    const {toolMessage,planOutline}=state
    const {tripSummary,start,end,startingLocation,destination,duration,budget,days}=planOutline 
            
try{
   const messages = [
  new SystemMessage(`You are a JSON output generator for travel activities. Output ONLY valid JSON array format with daily activities. Do not include any other text, explanations, or formatting.

REQUIRED JSON STRUCTURE:
[
  {
    "day": number,
    "date": "string",
    "activities": [
      {
        "time": "string",
        "title": "string", 
        "description": "string",
        "location": "string",
        "focusArea": "string",
        "tips": "string"
      }
    ]
  }
]

Rules:
- Output pure JSON only
- No markdown, no code blocks
- No additional text
- Valid JSON syntax only`),

  new HumanMessage(`Create daily activities JSON for:
Trip: ${tripSummary}
Dates: ${start} to ${end}
From: ${startingLocation} to ${destination}
Days: ${JSON.stringify(days)}
Info: ${toolMessage}

OUTPUT ONLY JSON:`)
];

const response= await dailyActivityLlm.invoke(messages)
return {dailyActivity:response}

}catch(error){console.log(error)}

}

 const graphBuilder= new StateGraph(state)

 const graph= graphBuilder
            .addNode('userInput',userInput)
            .addNode('validate',validate)
            .addNode('webTool',  webSearch) //webSearch tool
            .addNode('planOutlineGen',planOutlineGen)
            .addNode('flightGen',flightGen)
            .addNode('dailyActivityGen',dailyActivityGen)
            .addEdge('__start__','userInput')
            .addEdge('userInput','validate')
            .addConditionalEdges('validate',check)
            .addEdge('webTool','planOutlineGen')
            .addEdge('planOutlineGen','flightGen')
            .addEdge('planOutlineGen','dailyActivityGen')
            .addEdge('flightGen','__end__')
            .addEdge('dailyActivityGen','__end__')

 const workflow= graph.compile({checkpointer:checkPointer})

 
export async function regularCall(question){
    
    const received={input:question}

   
    const output=await  workflow.invoke(received,config)
    console.log(output)
    if(output?.__interrupt__ && output.__interrupt__.length > 0){
        return  {
            condition:'interrupt',
            message:output.__interrupt__[0].value
        }
    }else { 
        return {
        condition:'complete',
        message:output
         }
}
     
 }


 export async function resumeCall(question){
    const received=question;
    console.log(received)
    const output= await workflow.invoke(new Command({resume:received}),config)
    console.log(output)
    return output
 }