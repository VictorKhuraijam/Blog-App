import { fetchUserData } from "./authSlice";
import authService from "../appwrite/auth";


export const getCurrentUserData = () => async(dispatch) => {
  try {
      const userData = await authService.getCurrentUser();
      if(userData){
        const userDoc = await authService.getUser(userData.$id);
        if(userDoc){
          dispatch(fetchUserData({userData: userDoc}))
        }
      }
  } catch (error) {
    console.log("Error fetching current user data:",error)
  }
}
