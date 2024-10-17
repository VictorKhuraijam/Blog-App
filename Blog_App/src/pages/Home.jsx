import {useEffect} from 'react'
import { Container, PostCard } from '../components'
import authService from '../appwrite/auth'
import  appwriteService from '../appwrite/config'
import { useDispatch, useSelector } from 'react-redux'
import {fetchPostsStart, fetchPostsSuccess, fetchPostsFailure} from '../store/postSlice'


function Home() {


  const dispatch = useDispatch()
  const {posts, loading, error} = useSelector(state => state.posts)


  useEffect(() => {
  const checkAuth = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (session) {
          dispatch({type: 'auth/login', payload: {user: session.user}})
      } else {
        dispatch({type: 'auth/logout'})
      }

      //Fetch posts regardless of authentication status

      dispatch(fetchPostsStart()); // Dispatch the start action

        try {
          const post = await appwriteService.getPosts();
          if (post) {
            dispatch(fetchPostsSuccess({ posts: post.documents })); // Dispatch success action with posts
          } else {
            dispatch(fetchPostsFailure({ error: 'Failed to fetch posts' })); // Dispatch failure action with error

          }
        } catch (postError) {
          dispatch(fetchPostsFailure({ error: postError.message })); // Dispatch failure action with error
        }

    } catch (error) {
      console.error("Failed to check session:", error);
      dispatch({type: 'auth/logout'})
    }
  };

  checkAuth();
}, [dispatch]);


  if (loading) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <h1 className="text-2xl font-bold hover:text-gray-500">
                Loading posts...
              </h1>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if(posts.length === 0) {
    return(
      <div className='w-full py-8 mt-4 text-center'>
          <Container>
            <div className='flex flex-wrap'>
              <div className='p-2 w-full'>
                <h1 className='text-2xl font-bold hover:text-gray-500'>
                   No Post available
                </h1>
              </div>
            </div>
          </Container>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <h1 className="text-2xl font-bold hover:text-gray-500">
                Failed to load posts: {error}
              </h1>
            </div>
          </div>
        </Container>
      </div>
    );
  }


  return (
    <div className='w-full py-8'>
        <Container>
          <div className='flex flex-wrap'>
            {posts.map((post) =>(
              <div key={post.$id} className='p-2 w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4'>

                  <PostCard post={post}/>
              </div>
            ))}
          </div>
        </Container>
    </div>
  )
}

export default Home
