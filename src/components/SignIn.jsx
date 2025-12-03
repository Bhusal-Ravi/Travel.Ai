import React, { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "motion/react"
import { X } from 'lucide-react';

function SignIn() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState()
    const [success, setSuccess] = useState()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault();

        const { data, error } = await authClient.signIn.email(
            {

                email: email, // required
                password: password, // required
                callbackURL: "/",

            }, {
            onRequest: (ctx) => {

                console.log('Making Request...')
            },
            onSuccess: (ctx) => {

                setSuccess("Login Successful")
                setTimeout(() => {
                    setSuccess()
                    navigate('/')
                }, 1000)


            },
            onError: (ctx) => {

                setError(ctx.error.message)
                setTimeout(() => {
                    setError()
                }, 3000)
            }
        });
    }


    async function handleLoginGoogle() {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: 'http://localhost:5173'
        })
    }
    async function handleLoginGithub() {
        await authClient.signIn.social({
            provider: "github",
            callbackURL: 'http://localhost:5173'
        })
    }

    return (
        <div className="relative min-h-screen flex justify-center items-center bg-[#f4f1eb] px-4">
            <AnimatePresence>
                {error && <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    exit={{ x: 10, opacity: 0 }}
                    className='bg-red-400 font-bold  text-white rounded-l-xl p-5 border-rose-900 shadow shadow-black border-4 absolute top-10 right-10'>{error}</motion.div>}
            </AnimatePresence>
            <AnimatePresence>
                {success && <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    exit={{ x: 10, opacity: 0 }}
                    className='bg-emerald-400 font-semibold  text-black rounded-l-xl p-5 border-emerald-900 shadow shadow-black border-4 absolute top-10 right-10'>{success}</motion.div>}
            </AnimatePresence>
            <div className="bg-white shadow-md rounded-xl p-10 w-full max-w-md border border-[#e7e4dd]">
                <h2 className="text-2xl font-semibold text-center mb-6 text-[#3b3a36]">
                    Login to your Account
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">



                    <div>
                        <label className="block mb-1 text-[#4a4945] font-medium">
                            Email
                        </label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            className="w-full p-3 border border-[#d4cfc4] rounded-lg bg-[#faf9f7] focus:outline-none focus:ring-1 focus:ring-[#b8b3a9]"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-[#4a4945] font-medium">
                            Password
                        </label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            className="w-full p-3 border border-[#d4cfc4] rounded-lg bg-[#faf9f7] focus:outline-none focus:ring-1 focus:ring-[#b8b3a9]"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full cursor-pointer bg-[#4a4742] text-white py-3 rounded-lg mt-4 hover:bg-[#3e3b36] transition-all"
                    >
                        Sign In
                    </button>
                    <div className='flex flex-col justify-center items-center mt-4 '>
                        or continue with
                        <div className='flex justify-center gap-20 w-full items-center '>
                            <button onClick={handleLoginGoogle} className="cursor-pointer flex justify-center items-center bg-[#f2f2f2] text-white  rounded-lg mt-4 hover:bg-[#F4F1EB] h-12 w-20 transition-all"><img className='h-10 w-10' src="/google.svg.webp" alt="google login" /></button>
                            <button onClick={handleLoginGithub} className="cursor-pointer flex justify-center items-center bg-[#f2f2f2] text-white  rounded-lg mt-4 hover:bg-[#F4F1EB] h-12 w-20 transition-all"><img className='h-10 w-10' src="/github.png" alt="github login" /></button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignIn;
