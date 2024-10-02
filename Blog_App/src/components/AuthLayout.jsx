import {useEffect, useState} from 'react'
import {useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'


export default function Protected({children, authentication = true}) {

  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const authStatus = useSelector((state) => state.auth.status)
  console.log("Auth Status in Protected:", authStatus)

  useEffect(() => {

    // if(authStatus === true){
    //   navigate("/")
    // } else if(authStatus === false){
    //   navigate("/login")
    // }
    const checkAuth = () => {
      // If authentication is required and the user is not authenticated, redirect to login
      if (authentication && authStatus !== authentication) {
        navigate("/login");
      } else if (!authentication && authStatus !== authentication) {
        navigate("/");
      }
      setLoading(false);
    };

    checkAuth();
  }, [authStatus, navigate, authentication])


  return loading ? <h1>loading...</h1> : <> {children} </>
}
