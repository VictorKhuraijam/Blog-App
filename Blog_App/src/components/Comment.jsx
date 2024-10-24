import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import appwriteService from "../appwrite/config";
import authService from "../appwrite/auth";
import { timeAgo } from "./timeAgo.js";
import { Link } from "react-router-dom";
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
            setNewComment("");
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
        setEditingCommentId(commentId);
        setEditedCommentContent(currentContent)
    };

    const handleEditSubmit = async (commentId) => {
        if(!editedCommentContent.trim()) return;

        dispatch(editCommentStart());
        try {
            const updatedComment = await authService.updateComment(commentId, editedCommentContent);
            dispatch(editCommentSuccess(updatedComment));

            const updatedComments = comments.map((comment) =>
                comment.$id === commentId
                    ? { ...comment, content: editedCommentContent, updatedAt: new Date().toISOString() }
                    : comment
            );
            dispatch(fetchCommentsSuccess(updatedComments));

            setEditingCommentId(null);
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
            <div className="flex flex-col gap-4 justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Comments</h2>
                {!userData && (
                    <div className="text-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600 mb-2">Want to join the conversation?</p>
                        <Link
                            to="/signup"
                            className="text-blue-500 hover:text-blue-700 font-medium"
                        >
                            Sign up to comment
                        </Link>
                    </div>
                )}
            </div>

            {loading && <p>Loading comments...</p>}
            {error && <p>Error: {error}</p>}

            <div className="space-y-6">
                {Array.isArray(comments) && comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment?.$id} className="flex gap-6 bg-white border border-gray-200 rounded-lg p-4">
                            {/* User Info Section (1/3) */}
                            <div className="w-1/5 flex flex-col items-center border-r border-gray-200 pr-4">
                                <img
                                    src={getUserImageId(comment?.creator.$id, comment)}
                                    alt="User Avatar"
                                    className="h-16 w-16 rounded-full mb-2"
                                />
                                <h3 className="font-semibold text-center mb-1">{comment?.name}</h3>
                                <p className="text-gray-500 text-sm text-center">
                                    {formatDate(comment?.createdAt, comment?.updatedAt)}
                                </p>
                            </div>

                            {/* Comment Content Section (2/3) */}
                            <div className="w-4/5">
                                <div className="relative h-full">
                                    {/* Edit/Delete Buttons */}
                                    {userData?.$id === comment?.creator.$id && (
                                        <div className="absolute top-0 right-0 flex gap-2">
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

                                    {/* Comment Content */}
                                    {editingCommentId === comment?.$id ? (
                                        <div className="space-y-3 mt-8"> {/* Added top margin to prevent overlap with buttons */}
                                            <textarea
                                                value={editedCommentContent}
                                                onChange={(e) => setEditedCommentContent(e.target.value)}
                                                className="w-full border rounded-lg p-3 min-h-[100px]"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditSubmit(comment.$id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose max-w-none mt-8"> {/* Added top margin to prevent overlap with buttons */}
                                            <p className="text-gray-800 text-xl">{comment?.content}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic text-center">
                        No comments yet. {userData ? 'Be the first to comment!' : 'Sign up to be the first to comment!'}
                    </p>
                )}
            </div>

            {userData && (
                <form onSubmit={handleSubmit} className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
                    <textarea
                        className="w-full border rounded-lg p-3 min-h-[120px]"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                    >
                        Add Comment
                    </button>
                </form>
            )}
        </div>
    );
}
