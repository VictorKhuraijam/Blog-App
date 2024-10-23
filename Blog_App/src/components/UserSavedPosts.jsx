import { useState, useEffect, useCallback } from "react"
import appwriteService from '../appwrite/config'
import PostCard from "./PostCard"

function UserSavedPosts({id, onSaveToggle}) {
  // id is the user document ID

  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


    const fetchSavedPosts = useCallback(async () => {
      try {
        setLoading(true);
        const savedPosts = await appwriteService.getSavedPostsByUser(id);
        console.log("Fetched saved posts:", savedPosts);
        setSavedPosts(savedPosts);
      } catch (error) {
        console.log("Error fetching saved post:", error);
        setError("Failed to load saved posts. Please try again later");
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    fetchSavedPosts()
  },[fetchSavedPosts])

  const handleSaveToggle = useCallback((postId, isSaved) => {
    console.log(`UserSavedPosts: Save toggled for post ${postId}, isSaved: ${isSaved}`);
    if (onSaveToggle) {
      onSaveToggle(postId, isSaved);
    }
    setSavedPosts(prevPosts => {
      const updatedPosts = prevPosts.filter(post => post.$id !== postId);
      console.log("Updated saved posts:", updatedPosts);
      return updatedPosts;
    });
  }, [onSaveToggle]);



  if(loading) return <div className="text-center py-4">Loading saved Posts...</div>
  if(error) return <div className="text-center py text-red-500">{error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4"> Saved Posts</h2>
       <div className="flex flex-wrap -m-2">
       {savedPosts.length > 0 ? (
                savedPosts.slice() // Make a shallow copy of the posts array
                .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()) // Sort by date
                .map(savedPost => (
                  <div key={savedPost.$id}  className="p-2 w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
                  <PostCard
                    post={savedPost}
                    onSaveToggle={handleSaveToggle}
                    isSavedPostView={true}
                  />
                </div>
                 ))
              ) : (
                <p className="text-center">No saved posts available.</p>
              )}
       </div>
    </div>
  )
}

export default UserSavedPosts
