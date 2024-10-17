import { useEffect } from "react"
import { Container,  PostCard } from "../components"
import appwriteService from '../appwrite/config'
import { useDispatch, useSelector } from "react-redux"
import { fetchPostsStart, fetchPostsSuccess, fetchPostsFailure } from "../store/postSlice"

function AllPost() {
  const dispatch = useDispatch()
  const {posts, loading, error} = useSelector(state => state.posts)


  // Video 26
  useEffect(() => {
    const fetchPosts = async () => {
      dispatch(fetchPostsStart());
      try {
        const response = await appwriteService.getPosts([]);
        if(response){
          dispatch(fetchPostsSuccess({posts: response.documents}))
        }
      } catch (error) {
        dispatch(fetchPostsFailure({error: error.message}));
      }
    };
    fetchPosts();
  }, [dispatch])



  //Add case for array length 0 i.e. when you dont have any post

  if(loading) return <div>Loading . . .</div>

  if(error) return <div>Error: {error} </div>

  if(posts.length === 0) return <div
  className="py-11 text-4xl text-black-100 font-sans"
  >No posts available</div>

  return (
    <div className="w-full py-8">
      <Container>
      <div className="flex flex-wrap">
          {posts.map((post) => (
            <div
                key={post.$id}
                className="p-2 w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4"
            >
                <PostCard post={post}/>
            </div>

          ))}
        </div>
      </Container>
    </div>
  )
}

export default AllPost
