import React, { useState } from 'react'

function ChatUi() {
    const [loading, setLoading] = useState(false)
    const [state, setState] = useState();
    const [error, setError] = useState();

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
            const result = await response.json()
            console.log(result)
            setState(response)
            setLoading(false)
        } catch (error) { console.log(error) }
    }



    return (

        <div >

            <button disabled={loading} className='bg-green-400 p-2 cursor-pointer ' onClick={fetchState}>Click</button>


        </div>
    )
}

export default ChatUi