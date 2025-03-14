import { asyncHandler } from "../utils/asyncHandler.js";

import {ApiError} from "../utils/ApiError.js";

import {User} from "../models/user.model.js";

import {uploadOnCloudinary} from "../utils/cloudinary.service.js";

import { ApiResponce } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
    // res.status(200).json({
    //     message:"ok and utube backend! fun"
    // })

    // get user details from frontend
    // validation - not empty
    //check if user already exists: username,email
    //check for image ,check for avatar
    // if availabe ->upload them to cloudinary,avatar
    //create user object - create entry in db
    // remove passward and refresh token field from responce
    //check for user creation
    //return res

    //form ya json se data arha h to direct body se mil jayega
     const {fullName,email,username,password } = req.body
     console.log("email:",email ); 

     // for bigginer multi if for each filed 
    //  if(fullName ==""){
    //     throw new ApiError(400,"fullname is required")
    //  }

    //advance code for above one
    if(
        [fullName,email,username,password].some((field)=>
            field?.trim()=="")
    ){
        throw new ApiError(400,"all filed are required")
    }

    // or opereator v usse kreg ->yaha user ke through hmlog db match find krege
   const existedUsers =  User.findOne({
        $or:[{username},{email}]
    })

    if(existedUsers){
        throw new ApiError(409,"User with email or Username already exits")
    }

    //as we use middleware multer provide .files 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // object for database entry ref with user model krege
    const user = await User.create({
        fullName,
        avatar:avatar.url, // compulsery hai reqiued 
        coverImage:coverImage?.url || "", //not reqiued tha to or laga hai smjhe . corner case h ye
        email,
        password,
        username:username.toLowerCase()
    })

    // check kre rahe hai user create hua hai ya nahi then hua hai to fir select() jo nahi use sath usko hata rahe hai 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    //return responce yaha ApiResponce ka class bnay the pahle to uska object bana ke json me beje structure form me
    return res.status(201).json(
        new ApiResponce(200,createdUser,"User registered Successfully")
    )

})

export {registerUser}