import React from 'react'
import { authClient } from '../lib/auth-client';
import { useNavigate } from 'react-router-dom';

function Logout() {
    const navigate = useNavigate()
    async function handleLogout() {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    navigate("/signin"); // redirect to signin page
                },
                onError: (ctx) => {
                    console.log(ctx.error.message)
                }
            },
        });

    }
    return (
        <div>
            <button className='cursor-pointer' onClick={handleLogout}>
                Logout
            </button>
        </div>
    )
}

export default Logout