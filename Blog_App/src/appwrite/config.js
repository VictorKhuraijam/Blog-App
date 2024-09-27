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
      return this.bucket.getFilePreview(
        conf.appwriteBucketId,
        fileId
      )
    }
}


const service = new Service()
export default service
