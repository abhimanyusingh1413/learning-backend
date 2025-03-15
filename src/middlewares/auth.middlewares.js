import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// middleware bana rahe h for logoutuser q ki isko token milega logout ke ke kisko logout krna h
export const verifyJWT = asyncHandler(async(req,res,next)=>{  // yaha pe responce use nahi h to uske jagh _ dedo
  try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
  
    if(!token){
      throw new ApiError(401,"Unauthorized request")
    }
     
    //if token available check using jwt
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
    if(!user){
      //todo discuss about frontend
      throw new ApiError(401,"Invalied Access Token")
    }
  
    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
  }
})