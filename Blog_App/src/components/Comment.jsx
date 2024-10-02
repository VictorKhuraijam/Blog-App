import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import appwriteService from "../appwrite/auth.js";
import {
    fetchCommentsStart,
    fetchCommentsSuccess,
    fetchCommentsFailure,
    addCommentStart,
    addCommentSuccess,
    addCommentFailure,
    deleteCommentStart,
    deleteCommentSuccess,
    deleteCommentFailure
} from "../store/commentSlice";


export default function Comments({ postId }) {
    const [newComment, setNewComment] = useState("");
    const { comments, loading, error } = useSelector(state => state.comments);
    const userData = useSelector(state => state.auth.userData);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchComments = async () => {
            dispatch(fetchCommentsStart());
            try {
                const fetchedComments = await appwriteService.getCommentsForPost(postId);
                dispatch(fetchCommentsSuccess(fetchedComments));
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
            const comment = await appwriteService.addComment(postId, userData.$id, newComment);
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
            await appwriteService.deleteComment(commentId);
            dispatch(deleteCommentSuccess(commentId));
        } catch (error) {
            dispatch(deleteCommentFailure(error.message));
            console.error("Failed to delete comment:", error);
        }
    };

    return (
        <div className="comments-section">
            <h2 className="text-xl font-bold">Comments</h2>
            {loading && <p>Loading comments...</p>}
            {error && <p>Error: {error}</p>}

            {/* Display existing comments */}
            <div className="comments-list">
                {Array.isArray(comments) && comments.length > 0 ? (
                   comments.map((comment) => (
                        <div key={comment?.$id} className="comment-item p-2 border rounded-lg mb-2">
                            <div className="flex items-center mb-2">
                                <img
                                    src={comment?.imageUrl || 'assets/profile-placeholder.svg'}
                                    alt="User Avatar"
                                    className="h-8 w-8 rounded-full mr-3"
                                />
                                <div>
                                    <p className="font-semibold">{comment?.name}</p>
                                    <p className="text-gray-500 text-sm">
                                    {new Date(comment?.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <p>{comment?.content}</p>
                            
                            {userData.userId === comment?.userId && (  // Show delete button only for the comment owner
                                <button
                                    onClick={() => handleDelete(comment.$id)}
                                    className="text-red-500 text-sm mt-2"
                                >
                                    Delete
                                </button>
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
