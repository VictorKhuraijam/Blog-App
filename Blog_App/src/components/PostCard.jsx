import { useEffect, useState } from 'react'
import authService from '../appwrite/auth'
import appwriteService from '../appwrite/config'
import {Link} from 'react-router-dom'


function PostCard({
  $id, title, featuredImage, creator,
}) {

  const [author, setAuthor] = useState(null)

  useEffect(() => {
    const fetchAuthor = async () => {
      if (creator) {
        console.log("Fetching user for ID:", creator);
        try {
          const user = await authService.getUser(creator);
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
  }, [creator]);

  return (
    <Link to={`/post/${$id}`}>
      <div className='w-full bg-gray-100 rounded-xl p-4'>
        <div className='w-full justify-center mb-4'>
          <img
          src={appwriteService.getFilePreview(featuredImage)}
          alt={title}
          className='rounded-xl'
           />
        </div>
        <h2
        className='text-xl font-bold'
        >{title}</h2>
         {author && (
          <p className='text-gray-600 text-sm'>
            By {author.name || 'Unknown User'}
          </p>
        )}
      </div>
    </Link>
  )
}

export default PostCard
