import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchUserStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserSuccess(state, action) {
      state.loading = false;
      state.user = action.payload.user;
    },
    fetchUserFailure(state, action) {
      state.loading = false;
      state.error = action.payload.error;
    },
    // Added the reducer so that it is reflected on the header instantly instead of requiring a page refresh
    updateProfileImage(state, action) {
      if(state.user){
        state.user.imageId = action.payload.imageId;
      }
    },
    deleteProfileImage(state) {
      if(state.user) {
        state.user.imageIde = null;
      }
    },
  },
});

export const { fetchUserStart,
               fetchUserSuccess,
               fetchUserFailure,
               updateProfileImage,
               deleteProfileImage
             } = userSlice.actions;

export default userSlice.reducer;
