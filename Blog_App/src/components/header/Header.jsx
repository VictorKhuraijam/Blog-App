import { Container, Logo, LogoutBtn } from '../index'
import { NavLink, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import appwriteService from '../../appwrite/config'
import { getCurrentUserData } from '../../store/getCurrentUserData'
import { HiMenu, HiX } from 'react-icons/hi'

function Header() {
  const userData = useSelector((state) => state.auth.userData);
  const status = useSelector((state) => state.auth.status);
  const dispatch = useDispatch();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImageId, setProfileImageId] = useState(userData?.imageUrl || '/assets/profile-placeholder.svg');

  useEffect(() => {
    if (status === null || status === undefined) {
      return;
    }
    if(status && !userData) {
      dispatch(getCurrentUserData())
        .catch((err) => setError(`Failed to load user data: ${err.message}`))
        .finally(() => setLoading(false))
    } else {
      setLoading(false);
    }
  }, [dispatch, userData, status]);

  useEffect(() => {
    if (userData) {
      setProfileImageId(
        userData.imageId
          ? appwriteService.getProfilePicturePreview(userData.imageId)
          : userData?.imageUrl || '/assets/profile-placeholder.svg'
      );
    }
  }, [userData]);

  const navItems = [
    {
      name: 'Home',
      slug: "/",
      active: true,
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
    {
      name: "Explore",
      slug: '/explore',
      active: true,
    },
  ];

  if(loading) {
    return <div>Loading user data...</div>;
  }

  if(error) {
    return <div>{error}</div>;
  }

  return (
    <header className='relative py-3 shadow bg-gray-500 rounded-xl'>
      <Container>
        <nav className='relative flex justify-between items-center'>
          <div className='mr-4'>
            {!status ? (
              <Link to="/">
                <Logo width='100px' />
              </Link>
            ) : userData ? (
              <div>
                <Link to={`/profile/${userData.$id}`} className='flex items-center gap-3'>
                  <img
                    src={profileImageId}
                    alt="profile"
                    className='h-10 w-10 rounded-full'
                    onError={(e) => {
                      e.target.src = '/assets/profile-placeholder.svg'
                      setProfileImageId(userData?.imageUrl || '/assets/profile-placeholder.svg')
                    }}
                  />
                </Link>
              </div>
            ) : (
              <div>
                 <Link to="/">
                  <Logo  />
                </Link>
              </div>
            )}
          </div>

          {/* Menu Icon for Small Devices */}
          <div className='relative z-50 ml-auto md:hidden'>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className='p-2 hover:bg-gray-600 rounded-lg focus:outline-none'
            >
              {menuOpen ?
                <HiX className='h-6 w-6 text-white' /> :
                <HiMenu className='h-6 w-6 text-white' />
              }
            </button>
          </div>

          {/* Navigation Menu */}
          <div
            className={`
              absolute right-0 top-full
              w-48 mt-2
              bg-gray-500 rounded-lg shadow-lg
              md:relative md:top-auto md:w-auto md:bg-transparent md:shadow-none
              transition-all duration-200 ease-in-out
              ${menuOpen ? 'opacity-100 visible z-50' : 'opacity-0 invisible'}
              md:opacity-100 md:visible
            `}
          >
            <ul className='py-2 px-3 space-y-1 md:flex md:space-y-0 md:space-x-2 md:px-0 md:py-0'>
              {navItems.map((item) =>
                item.active && (
                  <li key={item.name}>
                    <NavLink
                      to={item.slug}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => `
                        block px-3 py-2 rounded-lg transition-colors duration-200
                        ${isActive
                          ? 'bg-gray-100 text-black font-medium'
                          : 'text-white hover:bg-gray-600 md:hover:bg-blue-100 md:hover:text-gray-900'}
                      `}
                      end={item.slug === "/"} // Add 'end' prop for home route to match exactly
                    >
                      {item.name}
                    </NavLink>
                  </li>
                )
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
  );
}

export default Header
