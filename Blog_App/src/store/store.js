import {configureStore} from "@reduxjs/toolkit"
import authSlice from './authSlice'
import postSlice from "./postSlice";
import commentSlice from "./commentSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";


const persistConfig = {
  key: "root",
  storage,
  whitelist: ['auth'] // Only persist the 'auth' slice
}

const persistedAuthReducer = persistReducer(persistConfig, authSlice);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    posts: postSlice,
    comments: commentSlice
  },
  
});

export const persistor = persistStore(store)
export default store
