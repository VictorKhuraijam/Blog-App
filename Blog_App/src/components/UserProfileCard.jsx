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
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 px-4">
        <Link
          to={`/profile/${userDocId}`}
          className="block w-full sm:w-[340px] md:w-[380px] lg:w-[400px]"
        >
          <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
            {/* Profile Image Section */}
            <div className="flex justify-center mb-3 sm:mb-6">
              <img
                src={user?.imageId ? appwriteService.getProfilePicturePreview(user.imageId) : user.imageUrl}
                alt="profile"
                className="h-20 w-20 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-full object-cover shadow-md"
                onError={(e) => {
                  e.target.src = '/assets/profile-placeholder.svg';
                }}
              />
            </div>

            {/* User Details Section */}
            <div className="text-center space-y-2 sm:space-y-3">
              {/* Name */}
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 line-clamp-1 px-2">
                {user?.name}
              </h2>

              {/* Username */}
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                @{user?.username}
              </p>

              {/* Bio Section - Wider container for larger screens */}
              <div className="h-10 sm:h-12 flex items-center justify-center px-3 sm:px-6 lg:px-8">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 empty:before:content-['No_bio_available'] empty:before:text-gray-500 empty:before:italic max-w-prose">
                  {user?.bio}
                </p>
              </div>

              {/* Posts Count Section */}
              <div className="pt-2 sm:pt-4 border-t border-gray-200">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700">
                  {postCount > 0 ? `Posts: ${postCount}` : 'No posts yet'}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </Container>
  );
}

export default UserProfileCard;
