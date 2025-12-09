import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation, interrupt, Command } from "@langchain/langgraph";
import {z} from 'zod'
import dotenv from 'dotenv'
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, AIMessage, SystemMessage,ToolMessage } from "@langchain/core/messages";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";


import { TavilySearch } from "@langchain/tavily";
import Database from 'better-sqlite3';
import { setMaxListeners } from 'events';
import { io } from './server.js';
import { strict } from "assert";
setMaxListeners(20);




dotenv.config()

const db = new Database('trip.sqlite');
let chatId=null;


export function setchatId(Id){
  chatId=Id
  console.log("hello")
  console.log("Graph.js hatID",chatId)
}






//Original LLM
const llm= new ChatGroq({
     model: "openai/gpt-oss-120b",
     temperature:0.2
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

   dailyActivity:Annotation({
    default:()=>({
          days:[{

          }]
    })
   }),

   locations:Annotation({
    default:()=>({
      location:[]
    })
   }),
    
   hotelsGen: Annotation({
  default: () => ({
    hotels: [
      {
        day: 1,
        location: '',
        hotel: {
          name: "",
          pricePerNight: "",
          rating: "",
          description: ""
        }
      }
    ]
  })
}),

   tripSummary:Annotation()

})

//Structured State for userInput format
const inputState= z.object({
    startingLocation:z.string().describe('place where the user is currently planning the trip from'),
    destination:z.string().describe("place where the person is willing to go"),
    startDate:z.string().describe('Start date for the travel'),
    endDate:z.string().describe('End date of the trip'),
    budget:z.string().describe('Total available budjet for the trip')
    
})

//Llm with structured output for userInput

const userInputLlm= llm.withStructuredOutput(inputState,{strict:false})



 
const checkPointer = new SqliteSaver(db);



 // userInput function is used to extract the data provided by user in a structured format based on the userInputLlm
 async function userInput(state){
    try{
      io.to(chatId).emit('agentUpdate',{
          agent:'User Input Analyzer',
          type:'input',
          message:'Analyzing you travel query'
      })

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
                          You need to extract the following fields: startingLocation, destination, startDate, endDate, budget.
                          If the users input does not provide adequate information you do not add random values, Make the remaining field empty.
                          Today's date: ${new Date().toDateString()}`
            }

        ]

        const response= await userInputLlm.invoke(messages)
        
         io.to(chatId).emit('agentUpdate',{
          agent:'User Input Analyzer',
          type:'output',
          message:` 🏠 From: ${response.startingLocation || 'Not specified'}
                    ✈️ To: ${response.destination || 'Not specified'}
                    📅 Start: ${response.startDate || 'Not specified'}
                    📅 End: ${response.endDate || 'Not specified'}
                    💰 Budget: ${response.budget || 'Not specified'}`
      })


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
       io.to(chatId).emit('agentUpdate',{
          agent:'Web Search Agent',
          type:'input',
          message:'Searching the web to plan the best trip for you'
      })
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
new HumanMessage(`Now analyze the search results above and provide a comprehensive travel information summary following the format and guidelines in your system instructions. Do not include message such as [ "Note: The information provided is based on the search results and may not be comprehensive or up-to-date. It's always a good idea to check with local authorities and tour operators for the latest information and advice.", ] Only summarize the information`)
]

    const finalResponse= await llm.invoke(finalMessage)

     io.to(chatId).emit('agentUpdate',{
          agent:'Web Search Agent',
          type:'output',
          message:finalResponse.content
      })

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
    const planOutlineLlm= llm.withStructuredOutput(planOutlineStructure,{strict:false})
    



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

###Caution

### Rules

1. Keep the plan **chronologically structured** by days.
2. Each day should have a **title** and a short **description** of the main activities or goals.
3. Do not include specific restaurant, hotel, or booking details — only the general flow.
4. The tone should be friendly, organized, and realistic.
5. Keep the trip Summary as short as possible`)
    ]

    try{
      io.to(chatId).emit('agentUpdate',{
          agent:'Plan Outline Agent',
          type:'input',
          message:'Creating a surface level plan for your trip'
      })


        const response= await planOutlineLlm.invoke(message)

      
          io.to(chatId).emit('agentUpdate',{
          agent:'Plan Outline Agent',
          type:'output',
          message: response
      })
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
      bookingLink: z.string().optional().describe("Booking page URL if available")
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
      bookingLink: z.string().optional().describe("Booking page URL if available")
    })
  ).describe("List of return flight options")
});



const flightToolStructured=llm.withStructuredOutput(flightGenStructure,{strict:false})

async function flightGen(state){
    try{

       io.to(chatId).emit('agentUpdate',{
          agent:'Flight Generation Agent',
          type:'input',
          message:'Looking up for flights'
      })
        const{trip,planOutline}=state
        const { tripSummary,start,end,startingLocation,destination,duration,budget,days}= planOutline


        const tool = new TavilySearch({ maxResults: 2, topic: 'general' });
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

    const finalMessage=[new SystemMessage(`You are a specialized Flight Search Agent.
Your goal is to analyze flight search results and return a structured list of outbound and return flights.

Rank options by:
1. Shortest duration
2. Best price/convenience balance
3. Airline reliability



Return ONLY the JSON object, no other text or explanation.`),

new HumanMessage(`Find available flights:
From: ${startingLocation}
To: ${destination}
Dates: ${start} - ${end}
Summary: ${tripSummary}`),

queryLlm,
toolMessage,
new HumanMessage(`Generate structured flight data based on the above results.`)
]

const finalResponse=await flightToolStructured.invoke(finalMessage,{strict:false})
console.log(finalResponse)


 io.to(chatId).emit('agentUpdate',{
          agent:'Flight Generation Agent',
          type:'output',
          message: finalResponse
      })

return { flightAgent:finalResponse}

    }catch(error){
        console.log(error)
    }
}

const dailyActivityTripStructure = z.object({
  days: z.array(
    z.object({
      day: z.number().describe("Day number of the trip (1, 2, 3, etc.)"),
      date: z.string().describe("Date for this day"),
      title: z.string().optional().describe("Optional brief title or theme for the day"),
      activities: z.array(
        z.object({
          time: z.string().optional().describe("Morning, afternoon, evening, or approximate time"),
          description: z.string().describe("Description of the activity"),
          location: z.string().optional().describe("Location for this activity"),
          focusArea: z.string().optional().describe("Focus or purpose, e.g., sightseeing, culture, trekking"),
          tips: z.string().optional().describe("Travel tips or advice")
        })
      ).describe("List of activities for this day")
    })
  ).describe("Array of daily itinerary items")
}).describe("Structured daily itinerary for the trip");

const dailyActivityLlm = llm.withStructuredOutput(dailyActivityTripStructure,{strict:false});

async function dailyActivityGen(state) {
  const { toolCallMessage, planOutline } = state;
  const { tripSummary, start, end, startingLocation, destination, duration, budget, days } = planOutline;

  try {

    io.to(chatId).emit('agentUpdate',{
          agent:'Daily Activity Agent',
          type:'input',
          message:'Planning your daily activities'
      })
    const messages = [
      new SystemMessage(`You are a travel itinerary generator.
Create a detailed day-by-day activity list based on the trip summary and location.
Split each day into Morning, Afternoon, and Evening.
Ensure descriptions are descriptive and useful.
Follow the schema strictly.`),

      new HumanMessage(`Generate daily activities:
Trip: ${tripSummary}
Dates: ${start} to ${end}
Route: ${startingLocation} -> ${destination}
Duration: ${duration} days
Budget: ${budget}
Days Outline: ${JSON.stringify(days)}
Context: ${toolCallMessage}`)
    ];

    console.log("DaysiNfo",JSON.stringify(days, null, 2))
    

    const response = await dailyActivityLlm.invoke(messages);
    console.log(response)
       io.to(chatId).emit('agentUpdate',{
          agent:'Daily Activity Agent',
          type:'output',
          message:response
      })
     return { dailyActivity: response };

  } catch (error) {
    console.error("Error generating daily activity:", error);
    return { error: "Failed to generate structured daily activity." };
  }
}



const locationStructure=z.object({
  location:z.array(
       z.string().describe("A unique location name")
  ).describe('List of unique locations')
})
const locationllm=llm.withStructuredOutput(locationStructure,{strict:false})


const hotelsStructure = z.object({
  hotels: z.array(
    z.object({
      day: z.union([z.string(), z.number()])
        .describe("Day number of the trip"),
      location: z.string()
        .describe("Main area or city of stay for that day"),
      hotel: z.object({
        name: z.string()
          .describe("Hotel name"),
        pricePerNight: z.string().optional()
          .describe("Approx price per night"),
        rating: z.string().optional()
          .describe("User or site rating of the hotel"),
        description: z.string().optional()
          .describe("Short description of the hotel")
      }).describe("Selected hotel for the day")
    })
  ).describe("List of selected hotels for each day of the trip")
});
const hotelLlm= llm.withStructuredOutput(hotelsStructure,{strict:false})

//Hotel generation or searching for available location
async function hotelGen(state){
  const {planOutline,trip}=state
  const {budget}=trip
 

  const messages= [new SystemMessage(`Extract all unique *stay or overnight locations* from the trip outline.
You must return ONLY a valid JSON array of location strings, nothing else.
Do NOT include the starting location.
Infer locations from the daily titles and descriptions.

Example output format: ["Paro", "Thimphu", "Punakha"]

Return ONLY the JSON array, no other text or explanation.`),
    new HumanMessage(`Extract unique stay locations from: ${JSON.stringify(planOutline)}`)
    ]

     io.to(chatId).emit('agentUpdate',{
          agent:'Hotel Finder Agent',
          type:'input',
          message:'Finding out the best hotels for you'
      })

  const response=await   locationllm.invoke(messages)

    
const toolCallResponse = await Promise.all(
  response.location.map(async location => {
    const tool = new TavilySearch({ maxResults: 1, topic: 'general' });
    return tool.invoke({query: `Best and affordable hotels in ${location} under ${budget} USD`});
  })
);



  const hotelMessages=[new SystemMessage(`Select **one hotel per day** based on the location and budget.
Rules:
1. One hotel per day.
2. Must be in the day's main location.
3. Respect the budget.
4. Return structured data only.`),
  new HumanMessage(`Select hotels for:
Locations: ${JSON.stringify(response.location)}
Search Results: ${JSON.stringify(toolCallResponse)}
Trip Outline: ${JSON.stringify(planOutline)}`)
  ]

         const response2= await hotelLlm.invoke(hotelMessages)

            io.to(chatId).emit('agentUpdate',{
          agent:'Hotel Finder Agent',
          type:'output',
          message:response2
      })

         return {locations:response,hotelsGen:response2}
}


async function summaryGen(state){
  const {flightAgent,dailyActivity,locations,hotelsGen,trip}=state


  const messages=[new SystemMessage(`
You are a smart travel assistant responsible for summarizing a user’s planned itinerary. 
You will be provided with structured information including:

- Daily activities for each day
- Hotel information per day
- Flight details (if available)
- Trip outline (start/end dates, starting location, destination, budget)

Your task:
1. Generate a clear, readable summary of the trip for the user.
2. Include one sentence per day describing the main activity and the hotel for that day.
3. Include a brief overview of flights and budget.
4. Use a friendly, organized tone.
5. Keep the summary concise and easy to understand.

Do not invent any information; only summarize what is provided.
Do not say things like  here is your summary,The summary is etc. Just only provide the summary
`),
new HumanMessage(`Summarize the following [${JSON.stringify(flightAgent)} \n ${JSON.stringify(dailyActivity)} \n ${JSON.stringify(locations)} \n ${JSON.stringify(hotelGen)} \n ${JSON.stringify(trip)}]`)]


const response= await llm.invoke(messages)

return {tripSummary:response.content}

}




 const graphBuilder= new StateGraph(state)

 const graph= graphBuilder
            .addNode('userInput',userInput)
            .addNode('validate',validate)
            .addNode('webTool',  webSearch) //webSearch tool
            .addNode('planOutlineGen',planOutlineGen)
            .addNode('flightGen',flightGen)
            .addNode('dailyActivityGen',dailyActivityGen)
            .addNode('hotelGen',hotelGen)
            .addNode('summaryGen',summaryGen)
            .addEdge('__start__','userInput')
            .addEdge('userInput','validate')
            .addConditionalEdges('validate',check)
            .addEdge('webTool','planOutlineGen')
            .addEdge('planOutlineGen','flightGen')
            .addEdge('planOutlineGen','dailyActivityGen')
            .addEdge('planOutlineGen','hotelGen')
            .addEdge('flightGen','summaryGen')
            .addEdge('dailyActivityGen','summaryGen')
            .addEdge('hotelGen','summaryGen')
            .addEdge('summaryGen','__end__')

 const workflow= graph.compile({checkpointer:checkPointer})

 
export async function regularCall(question,threadId){
    
    const received={input:question}

   const config={"configurable": {"thread_id": threadId}}
   
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


 export async function resumeCall(question,threadId){
    const received=question;
    const config={"configurable": {"thread_id": threadId}}
    console.log(received)
    const output= await workflow.invoke(new Command({resume:received}),config)
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

