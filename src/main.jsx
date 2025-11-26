import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Home from './components/Home.jsx';
import SignUp from './components/SignUp.jsx';
import SignIn from './components/SignIn.jsx';
import Protected from './components/Protected.jsx';
import Chat from './components/Chat.jsx';



const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          path: '/',
          element: <Protected><Home /></Protected>
        },
        {
          path: '/signup',
          element: <SignUp />
        },
        {
          path: '/signin',
          element: <SignIn />
        },
        {
          path: '/c/:chatId',
          element: <Chat />
        }
      ]
    }
  ]
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
