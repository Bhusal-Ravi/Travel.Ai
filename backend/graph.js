import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation, interrupt, Command } from "@langchain/langgraph";
import {z} from 'zod'
import dotenv from 'dotenv'
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import Database from 'better-sqlite3';
import { TavilySearch } from "@langchain/tavily";
import { ToolNode } from "@langchain/langgraph/prebuilt";

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
    })
})

//Structured State for userInput formatting
const inputState= z.object({
    destination:z.string().describe("place where the person is willing to go"),
    startDate:z.string().describe('Start date for the travel'),
    endDate:z.string().describe('End date of the trip'),
    budget:z.string().describe('Total available budjet for the trip')
    
})

//Llm with structured output for userInput

const userInputLlm= llm.withStructuredOutput(inputState)



 const config={"configurable": {"thread_id": '2'}}
 const checkPointer= new  MemorySaver()


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
                          You need to extract  {destination: , startDate: , endDate : , budget:  } from the users input. If the users input does not provide adequate information you do not add random values, Make the remaining field empty
                          
                          for example:[ example1=>(user:Plan me a trip to Tokyo 
                                        your output : {destination:"Tokyo",startDate:"" , endDate :"" , budget:"")})

                                        example2=>(user:Plan me a trip with destination: 'Tokyo',
                                                    startDate: 'Sun Oct 20 2025',
                                                    endDate: 'Sun Oct 27 2025',
                                                    budget: '1000'
                                                    your output: {destination: 'Tokyo',
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


async function validate(state){
        const {trip}= state
        const fields=['destination','startDate','endDate','budget']
        const missingFields= fields.filter(item=>trip[item]==='')
        console.log(missingFields)
        
            if(missingFields.length>0){
                const humanResponse= interrupt(`Please enter the missing Fields ${missingFields.map(item=>item,)}`)
                const output={condition:'interrupted',missing: missingFields, humanResponse:humanResponse}   
                return {validation:output}
            }else {
                const output={condition:'completed',missing: missingFields, humanResponse:""}
                return { validation: output }; 
            }
       
}

async function check(state){
        const {validation,humanResponse}=state
        const {condition,missing}=validation
        

        if(condition==='interrupted') return "userInput"
         return  'try'
}


async function trye(state){
    console.log(state)
}


 const graphBuilder= new StateGraph(state)

 const graph= graphBuilder
            .addNode('userInput',userInput)
            .addNode('validate',validate)
            .addNode('try',trye)
            .addEdge('__start__','userInput')
            .addEdge('userInput','validate')
            .addConditionalEdges('validate',check)
            .addEdge('try','__end__')

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