import { useState, useEffect } from 'react'
import {useDispatch} from "react-redux"
import './App.css'
import { getCurrentUserData } from './store/getCurrentUserData'
import {Header, Footer} from "./components"
import {Outlet} from "react-router-dom"

function App() {

  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
     await dispatch(getCurrentUserData()); // Dispatch your new function to fetch user data
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);



  return !loading ? (
    <div className='min-h-screen flex flex-wrap content-between bg-gray-400'>
      <div className='w-full block'>
        <Header />

        <main>
           <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  ) : null
}

export default App
