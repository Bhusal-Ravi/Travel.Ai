import React, { useEffect } from 'react'
import { authClient } from '../lib/auth-client';
import { Navigate, useNavigate } from 'react-router-dom'
import Loading from './Loading';
import { useUserId } from '../globalState/userIdStorage.js';

function Protected({ children }) {
    const globalUserId = useUserId((state) => state.setUserId)


    const {
        data: session,
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession()

    globalUserId(session.user.id)
    console.log(session)


    if (isPending) return <Loading />

    if (!session) {
        return <Navigate to="/signin" replace />
    }

    return children





}

export default Protected