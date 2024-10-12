import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, PostCard } from '../components';
import appwriteService from '../appwrite/config';
import authService from '../appwrite/auth';
import { fetchUserStart, fetchUserSuccess, fetchUserFailure } from '../store/userSlice';

function Profile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(state => state.user);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingImage, setIsManagingImage] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({
    name: "",
    username: "",
    bio: "",
    imageId: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useSelector(state => state.auth.userData)

  console.log("userID or Document ID:", id)
  console.log("user details:", user)


  useEffect(() => {
    if (!id) {
      console.error("No userId found in URL params");
      return;
    }
    const fetchUserProfile = async () => {
      dispatch(fetchUserStart());
      try {
        const userResponse = await authService.getUserByDocumentId(id);
        console.log("User Response",userResponse)
        if(!userResponse){
          throw new Error(`User not found for the document ID: ${id}`);
        }

        setUpdatedUser({
          name: userResponse.name,
          username: userResponse.username,
          bio: userResponse.bio || '',
          imageId: userResponse.imageId || 'assets/profile-placeholder.svg',
        });

            // Fetch posts using the userId from userResponse
            const postsResponse = await appwriteService.getPostsByUser(userResponse.userId);
            setPosts(Array.isArray(postsResponse) ? postsResponse : []);
            dispatch(fetchUserSuccess({ user: userResponse }));
          } catch (error) {
            dispatch(fetchUserFailure({ error: error.message }));
          }
        };

    fetchUserProfile();
  }, [dispatch, id]);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setUpdatedUser({ ...updatedUser, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setSelectedImage(file);

    //Dynamically update the image preview
    const fileReader = new FileReader();
    fileReader.onload = () => setPreviewImage(fileReader.result);
    if(file){
      fileReader.readAsDataURL(file);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setIsManagingImage(!isEditing);
  };

  const handleDeleteImage = async () => {
    try {
      // Check if the user has a profile picture to delete
      if (user.imageId) {
        console.log("Attempting to delete image with ID:", user.imageId); // Log the image ID being deleted

        const result = await appwriteService.deleteProfilePicture(user.imageId);
        console.log("Deletion result:", result)


        // Update the user's imageId in Redux to reflect the removal of the image
        dispatch(fetchUserSuccess({
          user: {
            ...user,
            imageId: null, // Set imageId to null after deletion
          },
        }));

        console.log("Profile picture deleted successfully");
      } else {
        console.log("No profile picture to delete");
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
    }
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

        try {
          let imageId = user.imageId || null ; // Using the stored image ID if it exists

          // If a new image was selected, upload it to Appwrite Storage
          if (selectedImage) {
            const newImagefile = await appwriteService.uploadProfilePicture(selectedImage);

            if (newImagefile.$id) {
              // If there's an existing image, delete it before using the new one

              if (imageId) {
                try {
                  await appwriteService.deleteProfilePicture(imageId);
                } catch (error) {
                  console.error("Error deleting the previous image:", error);
                }
              }
                // Update the imageId and imageUrl with the newly uploaded image details

              imageId = newImagefile.$id ;

            } else {
                throw new Error("Failed to upload image");
            }
        }

          // Update the user's profile data, including the new image URL
          const updatedProfileData = {
            name: updatedUser.name,
            username: updatedUser.username,
            bio: updatedUser.bio,
            imageId,
          };

          console.log("Submitting updated profile data:", updatedProfileData)

          // Call Appwrite service to update the user profile
          const updatedProfile = await authService.updateUserProfile(id, updatedProfileData); // Call Appwrite service to update user profile

          if (updatedProfile) {
                const refreshedUser = await authService.getUserByDocumentId(id)
                console.log("Profile updated successfully:", updatedProfile);

                dispatch(fetchUserSuccess({ user: refreshedUser }));  // Dispatch the updated user data
                setIsEditing(false);  // Exit edit mode
            } else {
                console.error("Failed to update profile.");
            }
        } catch (error) {
          console.error("Error updating profile:", error);
        } finally {
          setIsSubmitting(false);
        }
  }

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div>Error: {error}</div>;

  const isOwnProfile = currentUser && currentUser.$id === id

  return (
    <Container>
      <div className="flex flex-col items-center my-4">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between w-full md:w-3/4 lg:w-1/2 gap-8">
      {/* div1: Profile Image */}
      <div className="relative ">
        <img
          src={previewImage || (user?.imageId ? appwriteService.getProfilePicturePreview(user.imageId) : '/assets/profile-placeholder.svg')}
          alt="profile"
          className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full"
        />
        {isOwnProfile && !isEditing && (
          <div className="absolute bottom-0 right-0 bg-gray-700 text-white p-2 rounded-full cursor-pointer">
            <img
              src="/assets/icons-edit.png"
              alt="edit icon"
              width={20}
              onClick={handleEditToggle}
            />
          </div>
        )}
      </div>

      {/* div2: User Details */}
      <div className="flex-1 mt-4 md:mt-0 ml-4">
        {!isEditing ? (
          <>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-xl text-gray-600">@{user?.username}</p>
            <div className="mt-4">
              <h2 className="font-semibold ">Bio</h2>
              <p className="text-md p-2 rounded-sm">{user?.bio || 'This user has no bio.'}</p>
            </div>
          </>
        ) : (
          <form onSubmit={handleEditSubmit} className="w-full max-w-lg">
            {/* Form fields for editing */}
            {isManagingImage && (
              <div className="mt-4 mb-4">
                {user.imageId ? (
                  <>
                    <button
                      type="button"
                      className="bg-red-500 text-white py-2 px-4 rounded mr-2"
                      onClick={handleDeleteImage}
                    >
                      Delete Profile Picture
                    </button>
                    <label className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer">
                      Replace Profile Picture
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageChange}
                        accept="image/png, image/jpg, image/jpeg, image/gif"
                      />
                    </label>
                  </>
                ) : (
                  <label className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer">
                    Add Profile Picture
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleImageChange}
                      accept="image/png, image/jpg, image/jpeg, image/gif"
                    />
                  </label>
                )}
              </div>
            )}

            <input
              type="text"
              name="name"
              value={updatedUser.name}
              onChange={handleInputChange}
              placeholder="Name"
              className="w-full p-2 border mt-2"
            />
            <input
              type="text"
              name="username"
              value={updatedUser.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="w-full p-2 border mt-2"
            />
            <textarea
              name="bio"
              value={updatedUser.bio}
              onChange={handleInputChange}
              placeholder="Bio"
              className="w-full p-2 border mt-2"
            />

            <button
              type="submit"
              className="mt-4 bg-green-500 text-white py-2 px-4 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="mt-4 ml-2 bg-gray-500 text-white py-2 px-4 rounded"
              onClick={handleEditToggle}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
      </div>
        <div className="mt-8 w-full md:w-3/4 lg:w-1/2">
          <h2 className="text-2xl font-bold">Posts by {user?.name}</h2>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center mb-4">
            {posts.length === 0 ? (
              <p className="text-gray-600">
                This user has not created any posts yet.
              </p>
            ) : (
              posts.map((post) => (

                <div key={post.$id} className="p-2 w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
                <PostCard
                  $id={post.$id}
                  title={post.title}
                  featuredImage={post.featuredImage}
                  creator={post.creator}
                  $createdAt={post.$createdAt}
                  likes={post.likes}
                />
              </div>
               ) )
            )}
          </div>

    </Container>
  );
}

export default Profile;
