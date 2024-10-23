import { useState, useEffect, useCallback } from "react"
import appwriteServce from '../appwrite/config'
import PostCard from "./PostCard";
import Container from "./container/Container";

function UserPosts({id, onSaveToggle}) {
  // id is the User Document ID

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchUserPosts = async () => {
        try {
          setLoading(true);

          const userPosts = await appwriteServce.getPostsByDocumentId(id);

          setPosts(Array.isArray(userPosts) ? userPosts : []);

        } catch (error) {
          console.log("Error fetching user posts:", error);
          setError("Failed to load posts. Please try again later.");
        } finally{
          setLoading(false);
        }
      };
      fetchUserPosts();
    },[id])

      // Define a local onSaveToggle function
      const handleSaveToggle = useCallback((postId, isSaved) => {
        console.log(`UserPosts: Save toggled for post ${postId}, isSaved: ${isSaved}`);
        if (onSaveToggle) {
          onSaveToggle(postId, isSaved);
        }
        // Update local state if necessary
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.$id === postId ? {...post, isSaved: isSaved} : post
          )
        );
      }, [onSaveToggle]);


    if(loading) return <div> Loading posts...</div>
    if(error) return <div>{error}</div>

  return (
   <Container>
       <div>
         <h2 className="text-2xl font-bold mb-4">User Posts</h2>
           {posts.length === 0 ? (
              <p className="text-gray-600">
                This user has not created any posts yet.
              </p>
            ) : (
              <div className="flex flex-wrap -m-2">
                {posts.slice() // Make a shallow copy of the posts array
                  .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()) // Sort by date
                .map((post) => (
                  <div
                    key={post.$id}
                    className="p-2 w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4"
                  >
                    <PostCard
                      post={{
                        $id: post.$id,
                        title: post.title,
                        featuredImage: post.featuredImage,
                        creator: post.creator,
                        $createdAt: post.$createdAt,
                        likes: post.likes,
                        save: [post],
                      }}
                      onSaveToggle={handleSaveToggle}
                      isSavedPostView={false}
                    />
                  </div>
                ))}
              </div>
            )}
    </div>
   </Container>
  )
}

export default UserPosts
