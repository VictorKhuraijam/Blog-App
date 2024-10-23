import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import appwriteService from "../appwrite/config";
import authService from "../appwrite/auth";
import { timeAgo } from "./timeAgo.js";
import {
    fetchCommentsStart,
    fetchCommentsSuccess,
    fetchCommentsFailure,
    addCommentStart,
    addCommentSuccess,
    addCommentFailure,
    deleteCommentStart,
    deleteCommentSuccess,
    deleteCommentFailure,
    editCommentStart,
    editCommentSuccess,
    editCommentFailure
} from "../store/commentSlice";


export default function Comments({ postId }) {
    const [newComment, setNewComment] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentContent, setEditedCommentContent] = useState("");
    const { comments, loading, error } = useSelector(state => state.comments);
    const userData = useSelector(state => state.auth.userData);
    const [user, setUser] = useState({})
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchComments = async () => {
            dispatch(fetchCommentsStart());
            try {
                const fetchedComments = await authService.getCommentsForPost(postId);
                dispatch(fetchCommentsSuccess(fetchedComments));

                //Fetch user profile for each unique creator
                const uniqueCreatorIds = [...new Set(fetchedComments.map(comment => comment.creator.$id))];
                const profiles = await Promise.all(
                    uniqueCreatorIds.map(async (creatorId) => {
                        const user = await authService.getUserByDocumentId(creatorId);
                        return { [creatorId]: user };
                    })
                );
                setUser(Object.assign({}, ...profiles));
            } catch (error) {
                dispatch(fetchCommentsFailure(error.message));
            }
        };
        fetchComments();
    }, [postId, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        dispatch(addCommentStart());
        try {
            const comment = await authService.addComment(postId, userData.$id, newComment);
            dispatch(addCommentSuccess(comment));
            setNewComment("");  // Reset the input field
        } catch (error) {
            dispatch(addCommentFailure(error.message));
            console.error("Failed to add comment:", error);
        }
    };

    const handleDelete = async (commentId) => {
        dispatch(deleteCommentStart());
        try {
            await authService.deleteComment(commentId);
            dispatch(deleteCommentSuccess(commentId));
        } catch (error) {
            dispatch(deleteCommentFailure(error.message));
            console.error("Failed to delete comment:", error);
        }
    };

    const handleEditToggle = (commentId, currentContent) => {
        setEditingCommentId(commentId); // Enter edit mode
        setEditedCommentContent(currentContent)  // Set the current content to be edited
    };

    const handleEditSubmit = async (commentId) => {
        if(!editedCommentContent.trim()) return;

        dispatch(editCommentStart());
        try {
            const updatedComment = await authService.updateComment(commentId, editedCommentContent);
            dispatch(editCommentSuccess(updatedComment));

            // Update the local comments state immediately
            const updatedComments = comments.map((comment) =>
                comment.$id === commentId
                    ? { ...comment, content: editedCommentContent, updatedAt: new Date().toISOString() }  // Update the content and timestamp
                    : comment
            );
            // Dispatch an action to update the state with the modified comments
            dispatch(fetchCommentsSuccess(updatedComments));

            setEditingCommentId(null); //Exit edit mode
        } catch (error) {
            dispatch(editCommentFailure(error.message));
            console.log("Failed to update comment:", error);
        }
    };

    const formatDate = (createdAt, updatedAt) => {
        const createdTime = new Date(createdAt).toLocaleString();

        if (updatedAt && new Date(updatedAt).getTime() > new Date(createdAt).getTime()) {
            const updatedTime = new Date(updatedAt).toLocaleString();
            return `Updated ${timeAgo(updatedTime)}`;
        }

        return `Posted ${timeAgo(createdTime)}`;
    };

    const getUserImageId = (creatorId, comment) => {
        const profile = user[creatorId];
        if(profile && profile.imageId){
            return appwriteService.getProfilePicturePreview(profile.imageId)
        }
        return comment.imageUrl
    };


    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-xl font-bold">Comments</h2>
            {loading && <p>Loading comments...</p>}
            {error && <p>Error: {error}</p>}

            {/* Display existing comments */}
            <div className="space-y-4">
                {Array.isArray(comments) && comments.length > 0 ? (
                   comments.map((comment) => (
                 <div key={comment?.$id} className="p-4 bg-white border border-gray-300 shadow rounded-lg space-y-2">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                            <img
                              src={getUserImageId(comment?.creator.$id, comment)}
                              alt="User Avatar"
                            className="h-8 w-8 rounded-full mr-3"
                            />
                              <div>
                                        <p className="font-semibold">{comment?.name}</p>
                                        <p className="text-gray-500 text-sm">
                                        {formatDate(comment?.createdAt, comment?.updatedAt)}

                                        </p>
                              </div>
                       </div>
                      {/* Buttons aligned on the top-right */}
                        {userData?.$id === comment?.creator.$id && (
                        <div className="flex space-x-2 ml-auto">
                                        <button
                                            onClick={() => handleEditToggle(comment.$id, comment.content)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.$id)}
                                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                        </div>
                         )}
                    </div>

                        {editingCommentId === comment?.$id ? (
                                // If editing, show textarea with buttons
                                <>
                                <textarea
                                    value={editedCommentContent}
                                    onChange={(e) => setEditedCommentContent(e.target.value)}
                                    className="w-full border rounded-lg p-2"
                                />
                                <button
                                    onClick={() => handleEditSubmit(comment.$id)}
                                    className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="mt-2 ml-2 bg-gray-500 text-white px-4 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                                </>
                            ) : (
                                // Show the comment content normally
                                <p className="mt-2">{comment?.content}</p>
                            )}
                 </div>
                    ))
                ) : (
                    <p>No comments yet. Be the first to comment!</p>
                )}
            </div>

            {/* New comment form */}
            {userData && (
                <form onSubmit={handleSubmit} className="new-comment-form mt-4">
                    <textarea
                        className="w-full border rounded-lg p-2"
                        rows="3"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg">
                        Add Comment
                    </button>
                </form>
            )}
        </div>
    );
}
