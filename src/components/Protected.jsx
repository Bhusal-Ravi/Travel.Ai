import React, { useEffect } from 'react'
import { authClient } from '../lib/auth-client';
import { Navigate, useNavigate } from 'react-router-dom'
import Loading from './Loading';

function Protected({ children }) {


    const {
        data: session,
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession()


    if (isPending) return <Loading />

    if (!session) {
        return <Navigate to="/signin" replace />
    }

    return children





}

export default Protected