import { asyncHandler } from "../utils/asyncHandler.js";

import {ApiError} from "../utils/ApiError.js";

import {User} from "../models/user.model.js";

import {uploadOnCloudinary} from "../utils/cloudinary.service.js";

import { ApiResponce } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";

//method for access and refresh token
const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //objecct h user usme refreshtiken store kr rahe h
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false}) // mongoose ke baki fild v acticate pr jarurat nahi h yaha av not validate laga diya

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

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
   const existedUsers = await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUsers){
        throw new ApiError(409,"User with email or Username already exits")
    }
    //for testing i.e debuging console user kr rahe h
    // console.log(req.files);

    //as we use middleware multer provide .files 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath= req.files?.coverImage[0]?.path;
    // for his claasical if is used postman give error
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

//login user banyege yaha access and refresh token use krege
const LoginUser = asyncHandler(async(req,res)=>{
// req body ->data
//username or email
// find the user
// password check
//access and refresh token
//send cookies

const {email,username,password} = req.body

if (!(username || email)){
    throw new ApiError(400,"username or email is required")
}

const user = await User.findOne({
    $or:[{username},{email}]
})

if(!user){
    throw new ApiError(404,"User does not exist")
}

//user -> mera hai bnaya hus iske user.method() mera ispasword correct ye sab hoga dekh lena apna
//User->(capital) ye mongoose ka hai to findone ye uska mehod h
const isPasswordVailed = await user.isPasswordCorrect(password) 
if(!isPasswordVailed){
    throw new ApiError(401,"Invalid user credentials")
}

//acces and refresh token bar bar bana ya multiple use ho skta h ya hoga to ek method bana liyey h upar me asyn yhai h use krege 
const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

//query from db for user as phale pass and refreshtoken empty tha ab hoga usme kuch
const loggedInUser = await User.findById(user._id).
select("-password -refreshToken")

//cookies bje yaha option hota h
const options = {
    httpOnly:true, // ise cookie frontend dekh skte h pr server se modifed hogi
    secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponce(
        200,
        {
            user:loggedInUser,accessToken, //yaha pe data me mobile user ke local storage cookiess store hoga ya fronted same krna cha raha hoga
            refreshToken
        },
        "User logged In Successfully"
    )
)

})

//logout user yaha pe uska id se refresh token ye sab clear kr dege 
const logoutUser = asyncHandler(async(req,res)=>{
    //refresh token clear from db
   await User.findByIdAndUpdate(
         req.user._id,{ //verifyjwt  me user availbel tha yah se isko liya
            $set:{  // mongodb me refresh token del ya indefind kr diya
                refreshToken:undefined
            }   
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true, // ise cookie frontend dekh skte h pr server se modifed hogi
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponce(200),{},"User logged Out!")

})

//yaha se access token expire hogay hoga to fir frontend se req ayega bina login route hit kreg db refresh token check ke liye
const refreshAccesssToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
         const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
         
        //check 
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401," refesh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
         const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id )
    
         return res
         .status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",newRefreshTokene,options)
         .json(
            new ApiResponce(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
         )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalied refresh token")
    }
})

export {registerUser,LoginUser,logoutUser,refreshAccesssToken}