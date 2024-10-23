import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container } from '../components';
import {UserSavedPosts, UserPosts} from '../components/index'
import appwriteService from '../appwrite/config';
import authService from '../appwrite/auth';
import { fetchUserStart, fetchUserSuccess, fetchUserFailure, updateProfileImage, deleteProfileImage } from '../store/userSlice';
import { getCurrentUserData } from '../store/getCurrentUserData';


const Profile = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.user);
  const currentUser = useSelector((state) => state.auth.userData);

  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingImage, setIsManagingImage] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({
    name: '',
    username: '',
    bio: '',
    imageId: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageId, setProfileImageId] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    if (!id) {
      console.error('No userId found in URL params');
      return;
    }

    dispatch(fetchUserStart());
    try {
      const userResponse = await authService.getUserByDocumentId(id);
      if (!userResponse) {
        throw new Error(`User not found for the document ID: ${id}`);
      }

      setUpdatedUser({
        name: userResponse.name,
        username: userResponse.username,
        bio: userResponse.bio || '',
        imageId: userResponse.imageId || 'assets/profile-placeholder.svg',
      });

      const postsResponse = await appwriteService.getPostsByUser(userResponse.userId);
      dispatch(fetchUserSuccess({ user: userResponse, posts: postsResponse }));
    } catch (error) {
      dispatch(fetchUserFailure({ error: error.message }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (user) {
        setUpdatedUser({
            name: user.name,
            username: user.username,
            bio: user.bio || '',
            imageId: user.imageId || null,
        });
        setProfileImageId(
          user.imageId ? appwriteService.getProfilePicturePreview(user.imageId) : user.imageUrl
        );
    }
}, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      //Track if the image was deleted
      const wasImageDeleted = user.imageId && !updatedUser.imageId;

      //only handle image upload if there's a new selected image

      let imageId = null;
      if (selectedImage) {
        const newImageFile = await appwriteService.uploadProfilePicture(selectedImage);
        if (newImageFile.$id) {
          imageId = newImageFile.$id;
          //Dispatch updateProfileImage after successful upload
          dispatch(updateProfileImage({imageId}));
        } else {
          throw new Error('Failed to upload image');
        }
      } else if(!wasImageDeleted) {
        //Keep existing image if it wasn't deleted
        imageId = user.imageId;
      }

      const updatedProfileData = {
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        imageId: imageId, // This will be null if image was deleted and no new image selected
      };

      console.log('Updating profile with data:', updatedProfileData); // Debug log


      const updatedProfile = await authService.updateUserProfile(id, updatedProfileData);
      if (updatedProfile) {
        const refreshedUser = await authService.getUserByDocumentId(id);
        dispatch(fetchUserSuccess({ user: refreshedUser }));
        //Ensure the header updates with the new user data to reflect the change in profile picture instantly
        dispatch(getCurrentUserData());  // Fetch and update the global auth state

        setIsEditing(false);
        setIsManagingImage(false);
        setSelectedImage(null);
        setPreviewImage(null);

        //Update profile image ID based on the final state
        setProfileImageId(imageId ? appwriteService.getProfilePicturePreview(imageId) :
        user.imageUrl || '/assets/profile-placeholder.svg'
      );

      console.log('Profile updated successfully with imageId:', imageId);

      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + error.message); // Alert user about the error

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      setIsSubmitting(true);
      console.log('Attempting to delete image with ID:', user.imageId); // Debugging line

      if (user.imageId) {
        await appwriteService.deleteProfilePicture(user.imageId);

        // update the user profile in the database
        const updatedProfileData = {
          ...updatedUser,
          imageId: null,
        };

        const updatedProfile = await authService.updateUserProfile(id, updatedProfileData);
        if(!updatedProfile){
          throw new Error("Failed to update profile after image deletion");
        }

        //Update Redux state
        dispatch(deleteProfileImage());

        //Update local state
        setUpdatedUser(prev => ({ ...prev, imageId: null}));
        setPreviewImage(null);
        setSelectedImage(null);
        setProfileImageId(user.imageUrl || '/assets/profile-placeholder.svg');

         // Force refresh user data
         const refreshedUser = await authService.getUserByDocumentId(id);
         dispatch(fetchUserSuccess({ user: refreshedUser }));
         dispatch(getCurrentUserData());
         setIsManagingImage(false);

        console.log("profile picture deleted successfully.");
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
       // Show error to user
       alert('Error deleting profile picture: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveToggle = useCallback((postId, isSaved) => {
    console.log(`Profile: Save toggled for post ${postId}, isSaved: ${isSaved}`);
  }, []);

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div>Error: {error}</div>;

  const isOwnProfile = currentUser && currentUser.$id === id;

  return (
    <Container>
      <div className="flex flex-col items-center my-4">
        <div className="flex flex-col md:flex-row items-center  md:items-start justify-between w-full md:w-3/4 lg:w-1/2 gap-8">
          {/* Profile Image */}
          <div className="relative mt-10">
            <img
              src={previewImage || profileImageId}
              alt="profile"
              className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full"
              onError={(e) => {
                e.target.src = '/assets/profile-placeholder.svg';
                setProfileImageId(user.imageUrl || '/assets/profile-placeholder.svg');
              }}
            />
            {isOwnProfile && !isEditing && (
              <button
                className="absolute bottom-0 right-0 bg-gray-700 text-white p-2 rounded-full"
                onClick={() => {
                  setIsEditing(true);
                  setIsManagingImage(true);
                }}
              >
                <img src="/assets/icons-edit.png" alt="edit" width={20} />
              </button>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 mt-10 md:mt-10 ml-4 ">
            {!isEditing ? (
              <>
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <p className="text-xl text-gray-600">@{user?.username}</p>
                <div className="mt-4">
                  <h2 className="font-semibold">Bio</h2>
                  <p className="text-md p-2 rounded-sm">{user?.bio || 'User has no bio.'}</p>
                </div>
              </>
            ) : (
              <form onSubmit={handleEditSubmit} className="w-full max-w-lg">
                {/* Form fields for editing */}
                {/* ... (image management buttons) */}
                {isManagingImage && (
                  <div className="mt-4 mb-4 flex flex-1">
                    {user.imageId ? (
                      <>
                        <button
                          type="button"
                          className="bg-red-500 text-white py-2 px-4 rounded mr-2"
                          onClick={handleDeleteImage}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Deleting...' : 'Delete Profile Picture'}
                        </button>
                        <label className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer">
                          {isSubmitting ? 'Processing...' : 'Replace Profile Picture'}
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleImageChange}
                            accept="image/png, image/jpg, image/jpeg, image/gif"
                            disabled={isSubmitting}
                          />
                        </label>
                      </>
                    ) : (
                      <div className='flex justify-center'>
                        <label className="bg-blue-500 text-white py-2 px-4 rounded cursor-pointer">
                        {isSubmitting ? 'Processing...' : 'Add Profile Picture'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleImageChange}
                          accept="image/png, image/jpg, image/jpeg, image/gif"
                          disabled={isSubmitting}
                        />
                       </label>
                      </div>
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
                  className="w-full p-2 border mt-2 rounded-md resize-none min-h-[150px]"
                  rows={6}
                />
                <div className="mt-4 flex flex-1">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      setIsEditing(false);
                      setIsManagingImage(false);
                       // Reset form to original values
                      setUpdatedUser({
                        name: user.name,
                        username: user.username,
                        bio: user.bio || '',
                        imageId: user.imageId,
                      });
                      setPreviewImage(null);
                      setSelectedImage(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

        {/* Posts Section */}
        <div className="mt-8 w-full flex justify-center text-center">
          <h2 className="text-2xl font-bold">Posts by {user?.name}</h2>
        </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mt-8 gap-2">
        <button
          className={`px-4 py-2 ${activeTab === 'posts' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'} rounded-sm`}
          onClick={() => setActiveTab('posts')}
        >
          User Posts
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'saved' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'} rounded-sm`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Posts
        </button>
      </div>

      {/* Posts Display */}
      <div className="mt-6 mb-8 w-full">
        {activeTab === 'posts' ? (
          <UserPosts id={id} onSaveToggle={onSaveToggle} />
        ) : (
          <UserSavedPosts id={id} onSaveToggle={onSaveToggle} />
        )}
      </div>
    </Container>
  );
};

export default Profile;
