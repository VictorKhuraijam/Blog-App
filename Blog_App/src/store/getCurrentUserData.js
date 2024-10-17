import { fetchUserData } from "./authSlice";
import authService from "../appwrite/auth";


export const getCurrentUserData = () => async(dispatch) => {
  try {
      const userData = await authService.getCurrentUser();
      console.log("User Data by using this.account.get:",userData)
      if(userData){
        const userDoc = await authService.getUser(userData.$id);
        console.log("Serialized User Data:", userDoc);
        if(userDoc){
          dispatch(fetchUserData({userData: userDoc}))
        }
      }

  } catch (error) {
    console.log("Error fetching current user data:",error)
    throw error;
  }
}
