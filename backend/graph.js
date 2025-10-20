import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation, interrupt, Command } from "@langchain/langgraph";
import {z} from 'zod'
import dotenv from 'dotenv'
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import Database from 'better-sqlite3';
import { TavilySearch } from "@langchain/tavily";



dotenv.config()


//Web search tool
const tool= new  TavilySearch({
    maxResults:5,
    topic:'general'
});

const tools=[tool]


//Original LLM
const llm= new ChatGroq({
     model: "llama-3.3-70b-versatile",
     temperature:0.1
})

//LLm with webSearch tool
const llmTools=llm.bindTools(tools)


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

    planOutline:Annotation({
        default:()=>({
            tripSummary: "",
            startingLocation: "",
            destination: "",
            duration: "",
            budget: "",
            days: []
        })
    }),
    toolCallMessage:Annotation(),

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
 const checkPointer= new  MemorySaver()



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
         return  'planOutlineGen'
}



//planOutline structured format
    const planOutlineStructure= z.object({
        
  tripSummary: z.string().describe('Very Short summary for the given trip'),
  startingLocation: z.string().describe('Country where the user is currently located'),
  destination: z.string().describe('Country where the trip is happening'),
  duration: z.union([z.string(), z.number()]).describe('No of days of the trip'),
  budget: z.string().describe('The estimated budjet of the user'),
  days: z.array(
    
    z.object({
                     day: z.union([z.string(), z.number()]).describe('Which day of the trip is currently is'),
                    title: z.string().describe('title for the current day of the trip'),
                    description: z.string().describe('Short description of what will happen in this day'),
                    focusArea: z.string().describe('HighLight of the day')
                }))
  
    })

    //Making the llm equiped with the planOutlineStructre
    const planOutlineLlm= llm.withStructuredOutput(planOutlineStructure)
    const planOutlineLlmSearch=planOutlineLlm.bindTools(tools)


    //planOutlineGen is used to generate a high level plan for the specific trip, has the ability to websearch as well
async function planOutlineGen(state){
    
    const {trip,input,toolCallMessage}=state
    const {startingLocation, destination,startDate,endDate,budget}=trip


    const message= [
        new HumanMessage(`User has asked for this request: [${input}].Prepare a high Level outline for the trip with these details : ["startingLocation":${startingLocation}, "destination": ${destination}, "startDate": ${startDate}, "endDate": ${endDate}, "budget": ${budget}]. The tool call message is provided as [websearchmessage:[${toolCallMessage}]]`),

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
        const response= await planOutlineLlmSearch.invoke(message)

        if(response?.tool_calls.length>0){
            return {toolCallMessage:response}
        }

        return { planOutline:response}
    }catch(error){
        console.log(error)
    }

}

//webSearch tool execute
async function webSearch(state){
    const {toolCallMessage}=state
    const {query}=toolCallMessage
    const response= await tool.invoke({
  query: query
});
return {toolCallMessage:response}
}

//webCheck(state) is used to check weather a webcheck event has been called or not , and if so web is searched
function webCheck(state){
    const {toolCallMessage}= state

    if(toolCallMessage.tool_calls &&toolCallMessage.tool_calls.length>0){return 'webTool'}

    else {
        return 'trys'
    }

    

}

 const graphBuilder= new StateGraph(state)

 const graph= graphBuilder
            .addNode('userInput',userInput)
            .addNode('validate',validate)
            .addNode('webTool',  webSearch) //webSearch tool
            .addNode('planOutlineGen',planOutlineGen)
            .addNode('trys',trys)
            .addEdge('__start__','userInput')
            .addEdge('userInput','validate')
            .addConditionalEdges('validate',check)
            .addConditionalEdges('planOutlineGen',webCheck)
            .addEdge('webTool','planOutlineGen')
            .addEdge('planOutlineGen','trys')
            .addEdge('trys','__end__')

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