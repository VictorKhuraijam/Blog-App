import { useState, useEffect, useCallback } from "react"
import authService from "../appwrite/auth"


function PostStats({post, creator, onSaveToggle, isSavedPostView, savedPostId }) {
  const likesList = post.likes?.map((user) => user.$id) || [];

  const [likes, setLikes] = useState(likesList);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true);


  //We've wrapped the fetchCurrentUser function in a useCallback hook to optimize performance and prevent unnecessary re-renders.
  const fetchCurrentUser = useCallback( async () => {
      try {
        const userId = await authService.getCurrentUser();
          if(userId){
            const user = await authService.getUser(userId.$id)
            console.log("Current User",user);
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false)
          }
      } catch (error) {
        console.log("Error fetching user data:", error);
        setIsAuthenticated(false)
      } finally{
        setLoadingUser(false);
      }
    },[]);

    useEffect(() => {
      fetchCurrentUser();
    }, [fetchCurrentUser]);


  useEffect(() => {
    if(!loadingUser && currentUser){
      const savedPostRecord = currentUser?.save?.find(
        (record) => record.post.$id === post.$id
      );
      console.log("Saved Post Record:", savedPostRecord || "empty");
      setIsSaved(!!savedPostRecord);
    }
  },[loadingUser, currentUser, post.$id])

  const handleLikePost = async (e) => {
    e.stopPropagation();

        if (!currentUser || !currentUser.$id) {
          console.error("Current user is not authenticated");
          return;
        }

        let likesArray = [...likes];

        // Check if the current user's ID is in the likes array
        const userLikeId = currentUser.$id;

        if (likesArray.includes(userLikeId)) {
          // If user has already liked the post, remove their like
          likesArray = likesArray.filter((id) => id !== userLikeId);
        } else {
          // Otherwise, add the user's ID to the likes array
          likesArray.push(userLikeId);
        }

         setLikes(likesArray); // Update local state for UI feedback

        try {
          // Call the service to update likes in the database
          await authService.likePost(post.$id, likesArray);
        } catch (error) {
          console.error("Error liking post:", error);
        }
     };

  const handleSavePost = async (e) => {
    e.stopPropagation();

    if (!currentUser) {
      console.error("No current user found while trying to save post.")
      return;
    }
    try {
        const savedPostRecord = currentUser.save?.find(
          (record) => record.post.$id === post.$id
        );

        if (savedPostRecord) {
          // If already saved, delete the saved record
          await authService.deleteSavedPost(savedPostRecord.$id);
          setIsSaved(false); // Update the state immediately after deletion
        } else {
          // If not saved, create a new save record
          await authService.savePost(currentUser.$id, post.$id);
          setIsSaved(true); // Update the state immediately after saving
        }
           // Notify the parent component about the save status change
              // Add this check before calling onSaveToggle
          if (typeof onSaveToggle === 'function') {
            console.log(`Calling onSaveToggle for post ${post.$id}, isSaved: ${!isSaved}`);
            onSaveToggle(isSavedPostView ? savedPostId : post.$id, !isSaved);
          } else {
            console.warn('onSaveToggle is not a function', onSaveToggle);
          }

        await fetchCurrentUser();

    } catch (error) {
      console.error("Error handling save post:", error);
    }
  };


  return (
    <div className="flex justify-between items-center z-20">
      <div className="flex gap-2 mr-5">
        <img
          src={`${
            likes.includes(currentUser?.$id)
              ? "/assets/Liked.png"
              : "/assets/like.svg"
          }`}
          alt="like"
          width={25}
          height={25}
          onClick={isAuthenticated ?  handleLikePost : undefined}
          className={`cursor-pointer ${!isAuthenticated ? "opacity-50" : ""}`}
        />
        <p className="samll-medium lg:base-medium">{likes.length}</p>
      </div>

      <div className="flex gap-2 ">
        <img
          src={isSaved ? "/assets/saved.png" : "/assets/save.svg"}
          alt="like"
          width={30}
          height={25}
          onClick={isAuthenticated ?  handleSavePost : undefined}
          className={`cursor-pointer ${!isAuthenticated ? "opacity-50" : ""}`}
        />
        </div>
    </div>
  )
}

export default PostStats
