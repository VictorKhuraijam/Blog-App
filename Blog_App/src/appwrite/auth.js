import conf from '../conf/conf.js'
import appwriteService from './config.js'
import { Client, Account, ID, Avatars, Databases, Query} from 'appwrite'


export class AuthService {
    client = new Client();
    account;



        constructor() {
            this.client
                .setEndpoint(conf.appwriteUrl)
                .setProject(conf.appwriteProjectId);
            this.account = new Account(this.client)
            this.avatars = new Avatars(this.client)
            this.databases = new Databases(this.client)
        }

        async createAccount({email, password, name, username }) {

              try {
                  const userAccount = await this.account.create(
                    ID.unique(),
                    email,
                    password,
                    name,
                  );
                    // Send verification email
                    await this.sendVerificationEmail();

                    const userId = userAccount.$id;
                    const avatarUrl = this.avatars.getInitials(name)

                    const newUser = await this.saveUserToDB({
                      userId,
                      name: userAccount.name,
                      email: userAccount.email,
                      username,
                      imageUrl: avatarUrl,
                      isEmailVerified: false, //field to track verification status
                    })

                    return newUser;

             } catch (error) {
                    console.error("Sign up error", error);
                  }
            }

      // email Verification Methods
      async sendVerificationEmail () {
        try {
          await this.account.createVerification(
            conf.AppwriteRedirectUrl + '/verify-email' // frontend verification page URL
          );
          return true;
        } catch (error) {
          console.error("Error sending verification email:", error);
          throw error ;
        }
      }

      async confirmVerification(userId, secret) {
        try {
          await this.account.updateVerification(userId, secret);

          // Update user's verification status in database
          const userDocId = await this.getUserDocumentId(userId);
          if(userDocId){
            await this.databases.updateDocument(
              conf.appwriteDatabaseId,
              conf.appwriteUsersCollectionId,
              userDocId,
              {
                isEmailVerified: true
              }
            );
          }
          return true;
        } catch (error) {
          console.error("Error confirming verification:", error);
          throw error;
        }
      }

      async resendVerification(){
        try {
          await this.sendVerificationEmail()
          return true;
        } catch (error) {
          console.error("Error resending verification:", error);
          throw error;
        }
      }

      async isEmailVerified(){
        try {
          const user = await this.getCurrentUser();
          return user.emailVerification;
        } catch (error) {
          console.error("Error checking verification status:", error);
          return false;
        }
      }

      //Google Authentication Methods
      async createGoogleAuthSession() {
        try {
          return this.account.createOAuth2Session(
            'google',
            conf.AppwriteRedirectUrl + '/oauth/callback', //Success URL
            conf.AppwriteRedirectUrl + '/login', // Failure URL
            ['profile', 'email']  // Requested scopes
          );

        } catch (error) {
          console.error("Google auth session error:", error);
          throw error;
        }
      }

      async handleGoogleCallback(){
        try {
          const session = await this.getCurrentSession();
          if(!session){
            throw new Error("No active session found");
          }

          const user = await this.getCurrentUser()
          if(!user){
            throw new Error("No user found");
          }

          //Check if user already exists in database
          let dbUser = await this.listUserByUserId(user.$id);
          if(!dbUser){
            //Create new user in database
            const avatarUrl = this.avatars.getInitials(user.name);
            dbUser = await this.saveUserToDB({
              userId: user.$id,
              name: user.name,
              email: user.email,
              username: user.email.split('@')[0], // Create a default username
              imageUrl: avatarUrl,
              isEmailVerified: true, // Google-authenticated users are verified
              authProvider: 'google'
            });
          }
          return dbUser;
        } catch (error) {
          console.error("Google callback error:", error);
          throw error;
        }
      }

      //Enhanced login method to check verification
       async login({email, password}){
          try {
              const session = await this.account.createEmailPasswordSession(email, password);
              const user = await this.getCurrentUser()

              //Check if email is verified
              if(!user.emailVerification){
                await this.account.deleteSession('current'); //log out
                throw new Error("Please verify your email before logging in.");
              }
              return session
          } catch (error) {
           console.log(error)
            throw new Error("Failed to login. Please check your email and password and try again")
            }
          }

        async getCurrentUser(){
          try {
              return await this.account.get();
          } catch (error) {
              console.log("Appwrite service :: getCurrentUser :: error", error);
              return null;
          }
        }

        async getCurrentSession() {
          try {
            return await this.account.getSession('current');
          } catch (error) {
            console.log("Appwrite service :: getCurrentSession :: error", error);
            return null;
          }
        }


        async logout(){
          try {
            await this.account.deleteSessions();
          } catch (error) {
              console.log("Appwrite service :: logout :: error", error);
          }
        }

        //User collection

        async saveUserToDB({username, userId, email, name, imageUrl}){
          try {
            const newUser = await this.databases.createDocument(
              conf.appwriteDatabaseId,
              conf.appwriteUsersCollectionId,
              ID.unique(),
              {
                username,
                name,
                userId,
                email,
                imageUrl
              }
            )

            return newUser
          } catch (error) {
            console.log(error)
          }
        }

        async listUserByUserId(userId){
          try {
            const result = await this.databases.listDocuments(
              conf.appwriteDatabaseId,
              conf.appwriteUsersCollectionId,
              [Query.equal('userId', userId)]
            );

            if(result.documents.length > 0){
              return result.documents[0];
            } else {
              console.log("User not found");
              return null
            }
          } catch (error) {
            console.log("Error fetching user by userId:", error)
          }
        }

        async getUser(userId) {
         return await this.listUserByUserId(userId)
        }

        async getUserDocumentId(userId) {
          try {
              const result = await this.databases.listDocuments(
                  conf.appwriteDatabaseId,
                  conf.appwriteUsersCollectionId,
                  [Query.equal('userId', userId)] // Query to match userId in the collection
              );

              if (result.documents.length > 0) {
                  return result.documents[0].$id; // Return the document ID of the first matching user
              } else {
                  console.log("User document not found for userId:", userId);
                  return null; // No document found
              }
          } catch (error) {
              console.log("Error fetching user document ID:", error);
              throw new Error("Failed to fetch user document ID. Please try again later."); // Return a more user-friendly error message
          }
      }

        async getUserByDocumentId(id){
        try {
          console.log("Fetching user with document ID:", id);
          const user = await this.databases.getDocument(
            conf.appwriteDatabaseId,
            conf.appwriteUsersCollectionId,
            id
          );

          if(!user){
            console.log("No user found for the given document ID:", id)
            return null
          }
          return user
        } catch (error) {
          console.log("Error fetching user by document ID:", error)
          return null;
        }
      }

        async updateUserProfile(id, updatedProfileData) {
        try {
            // Assuming you store the profile data in the 'users' collection
            const response = await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteUsersCollectionId,
                id,  // The user document ID from your custom user collection
                updatedProfileData
            );
            console.log("User profile updated successfully", response);
            return response;
        } catch (error) {
            console.log("Appwrite service :: updateUserProfile :: error", error);
            throw new Error("Failed to update user profile");
        }
    }

        async GetAllUsers() {
          try {
              const result = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteUsersCollectionId
              );

              return result.documents
          } catch (error) {
            console.log("Error fetching all users:", error);
          }
        }


        // Comment collection

        async getCommentsForPost(postId) {
          try {
              const response = await this.databases.listDocuments(
                  conf.appwriteDatabaseId,
                  conf.appwriteCommentCollectionId,
                  [Query.equal('postId', postId)]
              );

              // For each comment, fetch user details (username, avatar)
              const commentsWithUserDetails = await Promise.all(
                  response.documents.map(async (comment) => {
                      try {
                          // Fetch user details by document ID (userId in the comment)
                          console.log('comment:', comment);

                          const user = await this.getUserByDocumentId(comment.creator.$id);
                          if (!user) {
                              console.log("User not found for comment:", comment);
                              return {
                                  ...comment,
                                  name: 'Unknown',
                                  imageUrl: ''
                              }; // Handle missing user
                          }
                          return {
                              ...comment,
                              name: user.name,
                              imageUrl: user.imageUrl
                          };
                      } catch (error) {
                          console.log(`Error fetching user for comment ${comment.$id}:`, error);
                          return {
                              ...comment,
                              name: 'Unknown',
                              imageUrl: ''
                          };
                      }
                  })
              );

              return commentsWithUserDetails;
          } catch (error) {
              console.log("Error fetching comments:", error);
              return [];
          }
      }

         async addComment(postId, creator, content) {
            try {
                // Fetch the user document ID using the userId
                console.log("User collection ID being used to add comment:", creator);
                const user = await this.getUserByDocumentId(creator);
                console.log("Fetched User:", user);
                if (!user) {
                    throw new Error(`User document not found for userId ${creator}.`);
                }

                const comment = await this.databases.createDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteCommentCollectionId,
                    ID.unique(),
                    {
                        postId,
                        creator,
                        content,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        name: user.name,
                        imageUrl: user.imageUrl
                    }
                );
                console.log("Created Comment:", comment)

                return comment;
            } catch (error) {
                console.log("Error adding comment:", error);
                return null;
            }
        }

          async updateComment(commentId, newContent) {
            try {
                // Fetch the current comment by its ID
                const comment = await this.databases.getDocument(
                    conf.appwriteDatabaseId,   // Database ID
                    conf.appwriteCommentCollectionId,  // Comments collection ID
                    commentId   // The unique ID of the comment to be updated
                );

                if (!comment) {
                    throw new Error(`Comment with ID ${commentId} not found.`);
                }

                // Update the comment's content and updatedAt fields
                const updatedComment = await this.databases.updateDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteCommentCollectionId,
                    commentId,
                    {
                        content: newContent,
                        updatedAt: new Date().toISOString() // Update the timestamp
                    }
                );

                console.log("Comment updated successfully:", updatedComment);
                return updatedComment;
            } catch (error) {
                console.log("Error updating comment:", error);
                return null;
            }
        }


         async deleteComment(commentId) {
            try {
                await this.databases.deleteDocument(
                    conf.appwriteDatabaseId,   // Database ID
                    conf.appwriteCommentCollectionId,  // Comments collection ID
                    commentId   // The unique ID of the comment to be deleted
                );
                console.log("Comment deleted successfully");
                return true;
            } catch (error) {
                console.log("Error deleting comment:", error);
                return false;
            }
        }

        //like and save functionality
                // ============================== LIKE POST
          async likePost(postId, likesArray) {
            try {
              const updatedPost = await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwritePostCollectionId,
                postId,
                { likes: likesArray }
              );

              if (!updatedPost) throw new Error("Failed to like the post");

              return updatedPost;
            } catch (error) {
              console.error("Error liking post:", error);
            }
          }

          // ============================== SAVE POST
          async savePost(userId, postId) {
            try {
              // Check if this post is already saved by the user
              const existingSave = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteSavesCollectionId,
                [
                  Query.equal("user", userId),
                  Query.equal("post", postId),
                ]
              );

              // If a save record exists, return the existing record without creating a new one
              if (existingSave.total > 0) {
                return existingSave.documents[0];  // Return the existing save record
              }

              // If no existing save record, create a new one
              const savedPost = await this.databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteSavesCollectionId,
                ID.unique(),
                { user: userId, post: postId }
              );

              if (!savedPost) throw new Error("Failed to save the post");

              return savedPost;
            } catch (error) {
              console.error("Error saving post:", error);
              throw error; // Rethrow to allow error handling elsewhere
            }
          }


          // ============================== DELETE SAVED POST
          async deleteSavedPost(savedId) {
            try {
              const status = await this.databases.deleteDocument(
                conf.appwriteDatabaseId,
                conf.appwriteSavesCollectionId,
                savedId
              );

              if (!status) throw new Error("Failed to delete saved post");

              return { status: "Ok" };
            } catch (error) {
              console.error("Error deleting saved post:", error);
            }
          }

          async getUserPosts(userId) {
            try {
              // userId is the appwrite userID and not the document ID
                const posts = await appwriteService.getPostsByUser(userId);
                return posts;
            } catch (error) {
                console.log("Error fetching posts for user:", error);
                return [];
            }
        }


  }

  const authService = new AuthService()

export default authService
