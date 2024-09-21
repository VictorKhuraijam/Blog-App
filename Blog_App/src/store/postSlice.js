import { createSlice } from "@reduxjs/toolkit";
import appwriteService from '../appwrite/config'

const initialState = {
    posts: [],
    loading: false,
    error: null,
};

const postSlice = createSlice({
    name: "posts",
    initialState,
    reducers: {
        fetchPostsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchPostsSuccess: (state, action) => {
            state.loading = false;
            state.posts = action.payload.posts;
        },
        fetchPostsFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload.error;
        },
        addPost: (state, action) => {
            state.posts.push(action.payload.post);
        },
        deletePost: (state, action) => {
            state.posts = state.posts.filter(post => post.id !== action.payload.postId);
        },
        setUsernames: (state, action) => {
            const{postId, username} = action.payload;
            const post = state.posts.find(post => post.$id === postId)
            if(post){
                post.username = username;
            }
        }
    },
});

export const {
    fetchPostsStart,
    fetchPostsSuccess,
    fetchPostsFailure,
    addPost,
    deletePost,
    setUsernames,
} = postSlice.actions;

export const fetchPosts = () => async (dispatch) => {
    dispatch(fetchPostsStart());
    try {
      const response = await appwriteService.getPosts([]);
      const posts = response.documents;
      dispatch(fetchPostsSuccess({ posts }));

      // Fetch usernames for each post
      await Promise.all(
        posts.map(async (post) => {
          const user = await appwriteService.getUserById(post.userId);
          dispatch(setUsernames({ postId: post.$id, username: user.name }));
        })
      );
    } catch (error) {
      dispatch(fetchPostsFailure({ error: error.message }));
    }
  };

export default postSlice.reducer;
