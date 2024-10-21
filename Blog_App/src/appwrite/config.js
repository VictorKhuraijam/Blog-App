import conf from '../conf/conf.js'
import { Client, Databases, ID, Storage, Query } from 'appwrite'

export class Service{
    client = new Client();
    databases;
    bucket;


    constructor(){
      this.client
          .setEndpoint(conf.appwriteUrl)
          .setProject(conf.appwriteProjectId);
          this.databases = new Databases(this.client);
          this.bucket = new Storage(this.client);

    }

      async createPost ({title,  content, featuredImage, status, creator, slug}) {
        try {
          if (!creator || !creator.$id){
            throw new Error("Invalid creator. Creator must be an object with a valid document ID.");
          }
          const creatorId = creator.$id
          console.log("Creating post with data:", {title, content, featuredImage, status, creator, slug});

              const response =  await this.databases.createDocument(
              conf.appwriteDatabaseId,
              conf.appwritePostCollectionId,
              ID.unique(),
              {
                title,
                content,
                featuredImage,
                status,
                creator: creatorId,
                slug
              }
            );
            console.log("Response from Appwrite:", JSON.stringify(response, null, 2));
            return response;
        } catch (error) {
            console.log("Appwrite service :: createPost :: error", error);
            throw error;
        }
    }

    async updatePost(postId, {title, content, featuredImage, status}) {
        try {
            return await this.databases.updateDocument(
              conf.appwriteDatabaseId,
              conf.appwritePostCollectionId,
              postId,
              {
                title,
                content,
                featuredImage,
                status,

              }
            )
        } catch (error) {
            console.log("Appwrite service :: updatePost :: error", error);
        }
    }

    async deletePost (postId) {
      try {
          await this.databases.deleteDocument(
            conf.appwriteDatabaseId,
            conf.appwritePostCollectionId,
            postId
          )
          return true
      } catch (error) {
          console.log("appwrite service :: deletePost :: error", error);
          return false
      }
    }

    async getPost(postId) {
        try {
          console.log("Fetching post with ID:", postId);
          const post = await this.databases.getDocument(
              conf.appwriteDatabaseId,
              conf.appwritePostCollectionId,
              postId
            );
            return post;

        } catch (error) {
            console.log("Appwrite service :: getPost :: error", error);
            return false
        }
    }

    async getPosts(queries = [Query.equal("status", "active")]) {
        try {
              return await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwritePostCollectionId,
                queries,
              )
        } catch (error) {
              console.log("Appwrite service :: getPosts :: error", error);
              return false
        }
    }

    //file upload service

    async uploadFile(file) {
        try {
            return await this.bucket.createFile(
              conf.appwriteBucketId,
              ID.unique(),
              file
            )
        } catch (error) {
              console.log("Appwrite service :: uploadFile :: error", error)
              return false
        }
    }

    async deleteFile(fileId) {
      try {
          await this.bucket.deleteFile(
            conf.appwriteBucketId,
            fileId
          )
          return true
      } catch (error) {
          console.log("Appwrite service :: deleteFile :: error", error);
          return false
      }
    }

    getFilePreview(fileId) {
      try {
          return this.bucket.getFilePreview(
              conf.appwriteBucketId,
              fileId
          );
      } catch (error) {
          console.error("Appwrite service :: getFilePreview :: error", error);
          return null; // Return a fallback or handle the error as needed
      }
  }

        async getPostsByUser(userId) {
        try {
            // Step 1: Fetch the user document by userId (Appwrite's user ID)
            const userDoc = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteUsersCollectionId,
                [Query.equal('userId', userId)] // Query the 'users' collection using the Appwrite user ID
            );

            // Ensure the user document exists
            if (userDoc.documents.length === 0) {
                console.log("User document not found for userId:", userId);
                return [];
            }

            const userCollectionDocId = userDoc.documents[0].$id; // Get the document ID from the users collection

            // Step 2: Query the posts by the user collection document ID (creator)
            const posts = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwritePostCollectionId,
                [Query.equal('creator', userCollectionDocId)] // Use the correct document ID from users collection
            );

            // Return the list of posts
            if (posts.documents.length > 0) {
                return posts.documents;
            } else {
                console.log("No posts found for user:",
                    userCollectionDocId);
                return [];
            }
        } catch (error) {
                console.log("Appwrite service :: getPostsByUser :: error", error);
                throw new Error("Failed to fetch posts for the user");
              }
        }


        async getPostsByDocumentId(documentId) {
            try {
                console.log("Fetching posts for user with document ID:", documentId);
                const posts = await this.databases.listDocuments(
                    conf.appwriteDatabaseId,
                    conf.appwritePostCollectionId,
                    [Query.equal('creator', documentId)]
                );

            if (posts.documents.length > 0) {
                console.log(`Found ${posts.documents.length} posts for user with document ID: ${documentId}`);
                return posts.documents;
            } else {
                console.log("No posts found for user with document ID:", documentId);
                return [];
               }
            } catch (error) {
                console.error("Appwrite service :: getPostsByDocumentId :: error", error);
                throw new Error("Failed to fetch posts for the user");
           }
        }

           // Upload profile picture to a different bucket (profile pictures bucket)
           async uploadProfilePicture(file) {
            try {
                return await this.bucket.createFile(
                    conf.appwriteProfileBucketId, // Using the profile bucket ID from conf
                    ID.unique(),
                    file
                );
            } catch (error) {
                console.log("Appwrite service :: uploadProfilePicture :: error", error);
                return false;
            }
        }

            // Delete profile picture
            async deleteProfilePicture(fileId) {


              try {
                    await this.bucket.deleteFile(
                      conf.appwriteProfileBucketId,
                      fileId
                    );
                    return true;
                } catch (error) {
                    console.log("Appwrite service :: deleteProfilePicture :: error", error);
                    return false;
                }
            }

            // Get the URL for a profile picture
            getProfilePicturePreview(fileId) {
              try {
                  return this.bucket.getFilePreview(
                      conf.appwriteProfileBucketId,
                      fileId
                  );
              } catch (error) {
                  console.error("Appwrite service :: getProfilePicturePreview :: error", error);
                  return null; // Return a fallback or handle the error as needed
              }
          }

          // Saved collection

          async getSavedPostsByUser(userId) {
            try {
                // Step 1: Query the saved collection for entries with the user's document ID
                const savedPosts = await this.databases.listDocuments(
                    conf.appwriteDatabaseId,
                    conf.appwriteSavesCollectionId,
                    [
                        Query.equal('user', userId)
                    ] // Query using the 'user' field directly
                );

                // Step 2: If there are saved posts, fetch each post's details using Promise.all
                if (savedPosts.documents.length > 0) {
                    const posts = await Promise.all(
                        savedPosts.documents.map(async (savedPost) => {
                            try {
                                const postId = savedPost.post.$id;
                                // Fetch the post details by its ID
                                const post = await this.databases.getDocument(
                                    conf.appwriteDatabaseId,
                                    conf.appwritePostCollectionId,
                                    postId
                                );
                                return {
                                    $id: savedPost.$id,
                                    user: savedPost.user,
                                    post // This contains the full post document
                                };
                            } catch (error) {
                                console.log(`Failed to fetch post with ID: ${savedPost.post}`, error);
                                return null; // Handle the case where a post might be missing
                            }
                        })
                    );

                    // Step 3: Filter out any null results (in case some posts were not found)
                    return posts.filter(post => post !== null);
                } else {
                    console.log("No saved posts found for user:", userId);
                    return [];
                }
            } catch (error) {
                console.log("Appwrite service :: getSavedPostsByUser :: error", error);
                throw new Error("Failed to fetch saved posts for the user");
            }
        }

}


const service = new Service()
export default service
