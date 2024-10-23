import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appwriteService from '../appwrite/config';
import authService from '../appwrite/auth';
import { Container } from '../components/index';

function UserProfileCard({ userDocId }) {
  const [user, setUser] = useState(null);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const fetchUserAndPostCount = async () => {
      if (userDocId) {
        console.log("Fetching user for ID:", userDocId);
        try {
          // Fetch user details
          const fetchedUser = await authService.getUserByDocumentId(userDocId);
          setUser(fetchedUser);
          console.log("Fetched user:", fetchedUser);

          //Fetch post count
          const posts = await appwriteService.getPostsByDocumentId(userDocId);
          setPostCount(posts.length);

        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      }
    };
    fetchUserAndPostCount();
  }, [userDocId]);

  if (!user) return null;

  return (
   <Container>
    <Link to={`/profile/${userDocId}`} className='block '>
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center profile-card">
      {/* Profile Image */}
      <div className="relative">
        <img
          src={user?.imageId ? appwriteService.getProfilePicturePreview(user.imageId) : user.imageUrl}
          alt="profile"
          className="h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 rounded-full object-cover"
        />
      </div>

      {/* User Details */}
      <div className="mt-4 text-center">
        <h2 className="text-lg font-semibold">{user?.name}</h2>
        <p className="text-sm text-gray-600">@{user?.username}</p>
        <p className="text-sm text-gray-700 mt-2 bio">{user?.bio || 'No bio available'}</p>
      </div>

    {/* {Post count} */}
        <div className='mt-1 text-center'>
          {
            postCount > 0 ? (
              <p className='text-sm text-gray-700'> Posts: {postCount}</p>
            ): (
              <p className='text-sm text-gray-700'>No post yet</p>
            )
          }
        </div>
    </div>
    </Link>
   </Container>
  );
}

export default UserProfileCard;
