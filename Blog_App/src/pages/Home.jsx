import {useEffect, useState, useCallback} from 'react'
import { Container, PostCard, SearchBar } from '../components'
import authService from '../appwrite/auth'
import appwriteService from '../appwrite/config'
import { useDispatch, useSelector } from 'react-redux'
import {fetchPostsStart, fetchPostsSuccess, fetchPostsFailure} from '../store/postSlice'

function Home({onSaveToggle = () => {}}) {
  const dispatch = useDispatch()
  const {posts, loading, error} = useSelector(state => state.posts);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // Separate authentication check and post fetching
  useEffect(() => {

    const fetchPosts = async () => {
      dispatch(fetchPostsStart());
      try {
        const post = await appwriteService.getPosts();
        if (post) {
          dispatch(fetchPostsSuccess({ posts: post.documents }));
        } else {
          dispatch(fetchPostsFailure({ error: 'Failed to fetch posts' }));
        }
      } catch (error) {
        dispatch(fetchPostsFailure({ error: error.message }));
      }
    };

    fetchPosts(); // This will run for all users, authenticated or not
  }, [dispatch]);

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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-2 w-full">
          <h1 className="text-2xl font-bold hover:text-gray-500">
            Loading posts...
          </h1>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-2 w-full">
          <h1 className="text-2xl font-bold hover:text-gray-500">
            Failed to load posts: {error}
          </h1>
        </div>
      );
    }

    return (
      <div className='flex flex-wrap'>
        {filteredPosts.length > 0 ? (
          filteredPosts
            .slice()
            .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
            .map((post) => (
              <div key={post.$id} className='p-2 w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4'>
                <PostCard post={post} />
              </div>
            ))
        ) : (
          <div className='p-2 w-full text-center'>
            <h1 className='text-2xl font-bold text-gray-500'>
              No posts found
            </h1>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='w-full py-8'>
      <Container>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search posts by title..."
        />
        {renderContent()}
      </Container>
    </div>
  );
}

export default Home
