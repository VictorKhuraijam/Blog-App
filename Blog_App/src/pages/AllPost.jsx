import { useEffect, useState, useCallback } from "react"
import { Container,  PostCard, SearchBar } from "../components"
import appwriteService from '../appwrite/config'
import { useDispatch, useSelector } from "react-redux"
import { fetchPostsStart, fetchPostsSuccess, fetchPostsFailure } from "../store/postSlice"

function AllPost({onSaveToggle = () => {}}) {
  const dispatch = useDispatch()
  const {posts, loading, error} = useSelector(state => state.posts)
  const [filteredPosts, setFilteredPosts] = useState([]);


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

   // Initialize filteredPosts when posts change
   useEffect(() => {
    setFilteredPosts(posts);
  }, [posts]);

  // Memoized search handler
  const handleSearch = useCallback((searchTerm) => {
    if(!searchTerm.trim()) {
      setFilteredPosts(posts);
      return;
    }
    const filtered = posts.filter(post =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [posts]);

  //Add case for array length 0 i.e. when you dont have any post

  if(loading) return <div>Loading . . .</div>

  if(error) return <div>Error: {error} </div>

  if(filteredPosts.length === 0) return <div
  className="py-11 text-4xl text-black-100 font-sans"
  >No posts available</div>

  return (
    <div className="w-full py-8">
      <Container>
        <SearchBar
            onSearch={handleSearch}
            placeholder="Search posts by title..."
          />
          <div className="flex flex-wrap">
              {filteredPosts.slice() // Make a shallow copy of the posts array
                    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()) // Sort by date
                    .map((post) => (
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
