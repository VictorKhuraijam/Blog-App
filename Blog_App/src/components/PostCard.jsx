import { useEffect, useState } from 'react'
import authService from '../appwrite/auth'
import appwriteService from '../appwrite/config'
import { Link } from 'react-router-dom'
import { timeAgo } from './timeAgo'
import PostStats from './PostStats';
import { getCurrentUserData } from '../store/getCurrentUserData'


function PostCard({ post, onSaveToggle, isSavedPostView}) {

  const [author, setAuthor] = useState(null);
  const {userId} = getCurrentUserData();

  const postData = isSavedPostView ? post.post : post;

  useEffect(() => {
    const fetchAuthor = async () => {
      if (post?.creator) {
        console.log("Fetching user for ID:", post.creator);
        try {
          const user = await authService.getUserByDocumentId(post.creator.$id);
          console.log("Fetched user:", user);
          if (!user) {
            console.error("User not found");
          } else {
            setAuthor(user);
          }
        } catch (error) {
          console.error("Failed to fetch author:", error);
        }
      }
    };
    fetchAuthor();
  }, [post?.creator]);

  if(!postData) return null;

  const {$id, title, featuredImage, creator, $createdAt, likes, save} = postData;


  return (
    <div className="w-full bg-gray-100 rounded-lg p-4 transition-shadow hover:shadow-md">
      {/* Image at the top */}
      <div className="mb-4">
        <Link to={`/post/${$id}`}>
          <img
            src={appwriteService.getFilePreview(featuredImage)}
            alt={title}
            className="rounded-lg object-cover h-48 w-full"
          />
        </Link>
      </div>

      {/* Text Section */}
      <div className="flex flex-col">
        <Link to={`/post/${$id}`}>
          <h2 className="text-md sm:text-lg md:text-base lg:text-xl font-bold mb-2 text-gray-800 overflow-hidden line-clamp-2 h-14">
            {title}
          </h2>
        </Link>

        {author && (
          <div className='flex items-center space-x-4 py-2'>
             {userId ? ( // Check if the user is authenticated
              <Link to={`/profile/${creator.$id}`}>
                <img
                  src={creator?.imageId || "../assets/profile-placeholder.svg"}
                  alt="user picture"
                  className='rounded-full w-12 lg:h12'
                />
              </Link>
            ) : (
              <img
                src={creator?.imageUrl || "../assets/profile-placeholder.svg"}
                alt="user picture"
                className='rounded-full w-12 lg:h12'
              />
            )}
            <div className='flex flex-col'>
              <p className="text-gray-800 font-semibold">{creator?.username}</p>
              <p className="text-gray-500 text-sm">{timeAgo($createdAt)}</p>
            </div>
          </div>
        )}
      </div>

      {/* PostStats section */}
      <PostStats
        post={postData}
        creator={creator}
        savedPostId={isSavedPostView ? post.$id : null}
        onSaveToggle={onSaveToggle}
        isSavedPostView={isSavedPostView}
      />
    </div>
  );
}

export default PostCard;
