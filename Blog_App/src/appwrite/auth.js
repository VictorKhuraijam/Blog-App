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

  }

  const authService = new AuthService()

export default authService
