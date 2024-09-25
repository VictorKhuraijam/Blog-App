import conf from '../conf/conf.js'
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
                    //call another method
                    const userId = userAccount.$id;
                    const avatarUrl = this.avatars.getInitials(name)

                    const newUser = await this.saveUserToDB({
                      userId,
                      name: userAccount.name,
                      email: userAccount.email,
                      username,
                      imageUrl: avatarUrl,
                    })

                    return newUser,this.login({email, password});


             } catch (error) {
                    console.error("Sign up error", error);
                  }
            }

        async login({email, password}){

          try {
              return await this.account.createEmailPasswordSession(email, password);
          } catch (error) {
           console.log(error)
          //  throw new Error("Failed to login. Please check your email and password and try again")
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
              return null; // Handle error
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
          return user
        } catch (error) {
          console.log("Error fetching user by document ID:", error)
          return null;
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
                          console.log('comment.userId:', comment.userId);

                          const user = await this.getUserByDocumentId(comment.userId.$id);
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



      async addComment(postId, userId, content) {
        try {
            // Fetch the user document ID using the userId
            console.log("User ID being used to add comment:", userId);
            const userDocumentId = await this.getUserDocumentId(userId);
            console.log("User Document ID:", userDocumentId);
            if (!userDocumentId) {
                throw new Error(`User document not found for userId ${userId}.`);
            }

            // Fetch user details using the document ID
            const user = await this.databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteUsersCollectionId,
                userDocumentId // Use the document ID here
            );
            console.log("Fetchd User:", user)

            const comment = await this.databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCommentCollectionId,
                ID.unique(),
                {
                    postId,
                    userId: userDocumentId,
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

  }

  const authService = new AuthService()

export default authService
