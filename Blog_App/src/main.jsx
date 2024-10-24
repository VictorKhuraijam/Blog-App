import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store, {persistor} from "./store/store.js"
import { PersistGate } from 'redux-persist/integration/react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthLayout, Login } from './components/index.js'
import {Home, AllPost, AddPost, EditPost, Post, Signup, Profile} from './pages/index.js'
import Explore from './pages/Explore.jsx'
import EmailVerification from './components/EmailVerification.jsx'
import VerificationPending from './components/VerificationPending.jsx'


const router = createBrowserRouter([
 {
  path: '/',
  element: <App />,
  children:[
    {
      path: '/verify-email',
      element: <EmailVerification />
    },
    {
      path: '/verification-pending',
      element: <VerificationPending />
    },
    {
      path: '/',
      element: <Home />
    },
    {
      path:'/login',
      element:(
        <AuthLayout authentication={false}>
          <Login />
        </AuthLayout>
      )
    },
    {
      path:'/signup',
      element:(
        <AuthLayout authentication={false}>
          <Signup />
        </AuthLayout>
      )
    },
    {
      path:'/profile/:id',
      element:(
        <AuthLayout authentication>
          {" "}
          <Profile />
        </AuthLayout>
      )
    },
    {
      path:'/all-posts',
      element:(
        <AuthLayout authentication>
          {" "}
          <AllPost />
        </AuthLayout>
      )
    },
    {
      path:'/add-post',
      element:(
        <AuthLayout authentication>
          {" "}
          <AddPost />
        </AuthLayout>
      )
    },
    {
      path:'/edit-post/:id',
      element:(
        <AuthLayout authentication>
          {" "}
          <EditPost />
        </AuthLayout>
      )
    },
    {
      path:'/post/:id',
      element: <Post />
    },
    {
      path: '/explore',
      element: <Explore />
    }
  ]
 }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router}/>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
