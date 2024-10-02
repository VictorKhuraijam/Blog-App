import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/config";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useDispatch, useSelector } from "react-redux";
import {fetchPostsStart, fetchPostsSuccess, fetchPostsFailure, deletePost as deletePostAction} from '../store/postSlice'
import Comments from "../components/Comment";

export default function Post() {
    const [post, setPost] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {loading, error} = useSelector(state => state.posts );

    const userData = useSelector((state) => state.auth.userData);

    useEffect(() => {
        const fetchPost = async () => {
        if (id) {
            dispatch(fetchPostsStart());
            try {
                const fetchedPost = await appwriteService.getPost(id);
                console.log("post:",fetchedPost)
                if(fetchedPost){
                    setPost(fetchedPost);
                    dispatch(fetchPostsSuccess({posts: [fetchedPost]}));
                } else {
                    navigate('/')
                }
            } catch (error) {
                dispatch(fetchPostsFailure({error: error.message}));
                navigate('/')
            }
        }else{
            navigate('/')
        }
    }
    fetchPost();
    }, [id, navigate, dispatch]);

    const isAuthor = post && userData ? (post.creator.$id  === userData.$id) : null;

    console.log("userData.$id:",userData?.$id)


    const deletePost = async () => {
       try {
        const status = await appwriteService.deletePost(post.$id);
        if(status){
            await appwriteService.deleteFile(post.featuredImage);
            dispatch(deletePostAction({postId: post.$id}));
            navigate('/')
        }
       } catch (error) {
            console.error('Failed to delete post:', error);
       }
    };

    if(loading){
        return <div>Loading . . . </div>
    }

    if(error) {
        return <div>Error: {error}</div>
    }

    return post ? (
        <div className="py-8">
            <Container>

                <div className="w-full flex justify-center mb-4 relative border rounded-xl p-2">
                    <img
                        src={appwriteService.getFilePreview(post.featuredImage)}
                        alt={post.title}
                        className="rounded-xl w-full max-w-lg h-auto"
                    />

                    {isAuthor && (
                        <div className="absolute right-6 top-6">
                            <Link to={`/edit-post/${post.$id}`}>
                                <Button bgColor="bg-green-500" className="mr-3">
                                    Edit
                                </Button>
                            </Link>
                            <Button bgColor="bg-red-500" onClick={deletePost}>
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
                <div className="w-full mb-6">

                    <h1 className="text-2xl font-bold">{post.title}</h1>
                </div>
                <div className="browser-css border rounded-xl">
                    {parse(post.content)}
                </div>

                <Comments postId={post.$id}/>
            </Container>
        </div>
    ) : null;
}
