import { createSlice } from '@reduxjs/toolkit';

// Initial state for the comments slice
      const initialState = {
                comments: [],
                loading: false,
                error: null,
              };

// Create a slice for comments
        const commentSlice = createSlice({
          name: 'comments',
          initialState,
          reducers: {
                  fetchCommentsStart: (state) => {
                    state.loading = true;
                    state.error = null;
                  },
                  fetchCommentsSuccess: (state, action) => {
                    state.loading = false;
                    state.comments = Array.isArray(action.payload) ? action.payload : [];
                  },
                  fetchCommentsFailure: (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                  },
                  addCommentStart: (state) => {
                    state.loading = true;
                    state.error = null;
                  },
                  addCommentSuccess: (state, action) => {
                    state.loading = false;
                    state.comments.push(action.payload);
                  },
                  addCommentFailure: (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                  },
                  deleteCommentStart: (state) => {
                    state.loading = true;
                    state.error = null;
                  },
                  deleteCommentSuccess: (state, action)=> {
                    state.loading = false;
                    state.comments = state.comments.filter(
                      (comment) => comment.$id !== action.payload
                    );
                  },
                  deleteCommentFailure: (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                  },
          },
        });

// Export actions
export const {
  fetchCommentsStart,
  fetchCommentsSuccess,
  fetchCommentsFailure,
  addCommentStart,
  addCommentSuccess,
  addCommentFailure,
  deleteCommentStart,
  deleteCommentSuccess,
  deleteCommentFailure,
} = commentSlice.actions;

export default commentSlice.reducer;
