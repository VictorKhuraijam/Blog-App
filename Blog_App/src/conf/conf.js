const conf = {
  appwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
  appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
  appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
  appwritePostCollectionId: String(import.meta.env.VITE_APPWRITE_POST_COLLECTION_ID),
  appwriteSavesCollectionId: String(import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID),
  appwriteUsersCollectionId: String(import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID),
  appwriteCommentCollectionId: String(import.meta.env.VITE_APPWRITE_COMMENT_COLLECTION_ID),
  appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
  appwriteProfileBucketId: String(import.meta.env.VITE_APPWRITE_PROFILE_BUCKET_ID),
  RTE_Api: String(import.meta.env.VITE_RTE_API),
  AppwriteRedirectUrl: 'blog-app-ashen-two.vercel.app'
}


export default conf
