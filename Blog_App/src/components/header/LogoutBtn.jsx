import {useDispatch} from 'react-redux'
import authService from '../../appwrite/auth'
import {logout} from  '../../store/authSlice'
import { useNavigate } from 'react-router-dom'


function LogoutBtn() {

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const logoutHandler = () => {
      authService.logout()
      .then(() => {
          dispatch(logout())
          navigate('/');
      }) .catch(error => {
        console.error("Logout failed:", error);
    });
  }
  return (
    <button
    className='w-full px-3 py-2 text-white text-left rounded-lg
                        hover:bg-gray-600 transition-colors duration-200
                        md:hover:bg-blue-100 md:hover:text-gray-900'
    onClick={logoutHandler}
    >Logout</button>
  )
}

export default LogoutBtn
