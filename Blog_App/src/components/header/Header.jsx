import {Container, Logo, LogoutBtn} from '../index'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUserData } from '../../store/getCurrentUserData'

function Header() {
  const userData = useSelector((state) => state.auth.userData);
  const status = useSelector((state) => state.auth.status);


  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("userData:", userData);
  console.log("status:", status);

  useEffect(() =>{
    if (status === null || status === undefined) {
      // Waiting for the status to be determined
      setLoading(true);
      return;
    }
      if(status === true && !userData){
        dispatch(getCurrentUserData())
        .catch((err) => setError(`Failed to load user data: ${err.message}`))
        .finally(() => setLoading(false))
      } else {
        setLoading(false);
      }
      console.log(userData)
  },[dispatch, userData, status])

  const navItems = [
    {
      name: 'Home',
      slug: "/",
      active: true
    },
    {
      name: "Login",
      slug: "/login",
      active: !status,
    },
    {
      name: "Signup",
      slug: "/signup",
      active: !status,
    },
    {
      name: "All Posts",
      slug: "/all-posts",
      active: status,
    },
    {
      name: "Add Post",
      slug: "/add-post",
      active: status,
    },

  ];

  if(loading){
    return <div>Loading user data...</div>;
  }

  if(error){
    return <div>{error}</div>

  }

  return (
    <header className='py-3 shadow bg-gray-500 rounded-xl'>
      <Container>
        <nav className='flex justify-between items-center'>
          <div className='mr-4'>
            {!status ? (
              <Link to="/">
              <Logo width='100px' />
            </Link>
            ) : userData ? (
              <div>
                <Link to={`/profile/${userData.userId}`}
                className='flex-center gap-3'>
                  <img
                  src={userData?.imageUrl || 'assets/profile-placeholder.svg'}
                  alt="profile"
                  className='h-8 w-8 rounded-full'
                  />
                </Link>
            </div>
            ) : (
              <div> </div>
            )}
          </div>

          <div>
          <ul className='flex ml-auto'>
              {navItems.map((item) =>
            item.active ? (
              <li key={item.name}>
                <button
                onClick={() => navigate(item.slug)}
                className='inline-block px-6 py-2 duration-200 hover:bg-blue-100 rounded-full'
                >{item.name}</button>
              </li>
            ) : null
            )}
            {status && (
              <li>
                <LogoutBtn />
              </li>
            )}
          </ul>
          </div>
        </nav>
      </Container>
    </header>
  )
}

export default Header
