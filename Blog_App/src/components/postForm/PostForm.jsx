import {useCallback, useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {Button, Input, Select, RTE} from '../index'
import appwriteService from '../../appwrite/config'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'


function PostForm({post}) {
  const {register, handleSubmit, watch, setValue, control, getValues} = useForm({
    defaultValues: {
        title: post?.title || '',
        slug: post?.slug|| '',
        content: post?.content || '',
        status: post?.status || 'active',
    },
  })

  const navigate = useNavigate()
  const userData = useSelector(state => state.auth.userData)
  console.log("UserData in the post component",userData)

  const submit = async (data) => {
   try {
      const slug = slugTransform(data.title, userData.$id);  // Generate slug
      console.log('Generated slug:', slug);    // Log the slug

      const userDocumentId = userData.$id;

      if(!userDocumentId){
        throw new Error("User document ID not found for the current user.")
      }

      if(post) {
        const file = data.image[0] ? await appwriteService.uploadFile(data.image[0]) : null;

        if(file) {
          appwriteService.deleteFile(post.featuredImage)
        }

        const dbPost = await appwriteService.updatePost(post.$id, {
            title: data.title,
            content: data.content,
            featuredImage: file ? file.$id : undefined,
            status: data.status,
            slug,

          })

          if(dbPost){
            console.log("Post updated with slug:", slug)
            navigate(`/post/${dbPost.$id}`);
          }
         else {
          console.error("Post not found by slug.")
        }
      } else {
          const file = await appwriteService.uploadFile(data.image[0]);
          console.log("Uploaded file:", file);

          if(file){
            const postData = {
              title: data.title,
              content: data.content,
              featuredImage: file.$id,
              status: data.status,
              slug,
              creator: { $id: userDocumentId },
            }
            console.log("Submitting post data:", postData);

            const dbPost = await appwriteService.createPost(postData);

            if(dbPost){

              navigate(`/post/${dbPost.$id}`)
            }
          }
      }
   } catch (error) {
      console.log("Error in submitting post:", error);
   }
  }

  const slugTransform = useCallback((value, postId) => {
    if(value && typeof value === 'string'){
      let slug = value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, '-')
                .replace(/\s/g, '-')

                if(postId){
                  slug = `${slug}-${postId}`;
                }
                return slug
              }
    return ''

  }, [])

  useEffect(() => {
      const subscription = watch((value, {name}) => {
          if(name === 'title'){
            setValue('slug', slugTransform(value.title), {shouldValidate: true})
          }
      })
        return () => {
        subscription.unsubscribe()
      }
  }, [watch, slugTransform, setValue])


  return (
    <form onSubmit={handleSubmit(submit)}  className='flex flex-col'>
            <div className='py-3 mb-2'>

            </div>
            <div className="flex flex-wrap">
                <div className="w-2/3 px-2">
                    <Input
                        label="Title :"
                        placeholder="Title"
                        className="mb-4"
                        {...register("title", { required: true })}
                        onInput={(e) => {
                          setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                      }}
                    />
                    <Input
                        label="Slug :"
                        placeholder="Slug"
                        readOnly
                        className="mb-4"
                        {...register("slug", { required: true })}


                    />
                    <RTE label="Content :"
                        name="content"
                        control={control}
                        defaultValue={getValues("content")} />
                </div>
                <div className="w-1/3 px-2">
                    <Input
                        label="Featured Image :"
                        type="file"
                        className="mb-4"
                        accept="image/png, image/jpg, image/jpeg, image/gif"
                        {...register("image", { required: !post })}
                    />
                    {post && (
                        <div className="w-full mb-4">
                            <img
                                src={appwriteService.getFilePreview(post.featuredImage)}
                                alt={post.title}
                                className="rounded-lg"
                            />
                        </div>
                    )}
                    <Select
                        options={["active", "inactive"]}
                        label="Status"
                        className="mb-4"
                        {...register("status", { required: true })}
                    />
                    <Button type="submit" bgColor={post ? "bg-green-500" : 'bg-blue-500'} className="w-full">
                        {post ? "Update" : "Submit"}
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default PostForm
