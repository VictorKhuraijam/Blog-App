import { useEffect, useState, useCallback } from 'react'
import authService from '../appwrite/auth'
import appwriteService from '../appwrite/config'
import { Link } from 'react-router-dom'
import { timeAgo } from './timeAgo'
import PostStats from './PostStats';


function PostCard({ post, onSaveToggle = () => {}, isSavedPostView}) {

  const [author, setAuthor] = useState(null);

  const postData = isSavedPostView ? post.post : post;

  useEffect(() => {
    const fetchAuthor = async () => {
      if (postData?.creator) {
        console.log("Fetching user for ID:", postData.creator);
        try {
          const user = await authService.getUserByDocumentId(postData.creator.$id);
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
  }, [postData?.creator]);

  const handleSaveToggle = useCallback((postId, isSaved) => {
    console.log(`PostCard: Save toggled for post ${postId}, isSaved: ${isSaved}`);
      if (onSaveToggle) {
        onSaveToggle(isSavedPostView ? post.$id : postId, isSaved);
      } else {
        console.warn('onSaveToggle is not defined in PostCard');
      }
    }, [onSaveToggle, post, isSavedPostView]);

  if(!postData) return null;

  const {$id, title, featuredImage, creator, $createdAt } = postData;

  return (
    <div className="w-full bg-gray-100 rounded-lg p-4 transition-shadow hover:shadow-xl hover:scale-105">
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
            {/* Link wrapping the image */}
            <Link to={`/profile/${creator.$id}`}>
              <img
                src={author?.imageId ? appwriteService.getProfilePicturePreview(author.imageId) : author?.imageUrl}
                alt="user picture"
                className='rounded-full w-10 h-10 lg:h10'
              />
            </Link>
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
        onSaveToggle={handleSaveToggle}
        isSavedPostView={isSavedPostView}
      />
    </div>
  );
}

// // Added this line since the prop is only passed in some pages or component and not all thereby suppressing the warning
// PostCard.defaultProps = {
//   onSaveToggle: () => {}, // Empty function to suppress warning
// };
// React now depriciate this kind of code, instead passed as default on to the props


export default PostCard;
