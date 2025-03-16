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

// controller for paswd update
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Password changed successfully"))

})

// to get current user-->return kreg q ki middleware me user direct h jo av active h
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponce(200,req.user,"current user fetched successfully"))
})


// agar kv sirf file update kena jo kasie profilepic ye sab alag contoller liko dirst endpoint hit kreg bar bar ssab details update nahi kreg text baar jayega db me
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email}= req.body

    // if(!(fullName || email)){ mera h
    //     throw new ApiError(400,"All fields are required")
    // }
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponce(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path //files na hoke file ek hi le rahe h waha do le coverImage v tha

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    //TODO:dele old image -avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400," error while uploading on avatar")
    }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponce(200,user,"Avatar image updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path //files na hoke file ek hi le rahe h waha do le coverImage v tha

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400," error while uploading on coverImage")
    }

     const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponce(200,user,"Cover image updated successfully")
    )
})

//aggrerate pipline from subscribition schema to find subscriber and cahnnel subscribed
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params  // param is used for url se username lege uska 

    if(!username?.trim()){
        throw new ApiResponce(400,"username is missing")
    }

    // in aggreagete pipline stages are there at every stage some filteration is done and for next stage it is input
    // value in aggregate pipe value array ke form me at h 
   const channel = await User.aggregate([
    { //first pipline(stage1) -->find kr user scema me pauch gaye 
        $match:{  // field--> match
            username:username?.toLowerCase() //output hmlog me match ek filed h ek hi ayega iske acc hi ata h
        }
    },
    { // second pileline(stage2)-->channel ke kitne subscriber hai wo dekehge ab
        $lookup:{
            from:"Subscription",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {//third piple (stage3)-->channel kitna ko subscribe kiya h
        $lookup:{
            from:"Subscription",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },
    {
        $addFields:{ //addfiled 
            subscriberCount:{
                $size:"$subscribers" //count kr rahe no. of subscribers.
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"  //count same
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{ // wahi beje ge jo need go nahi to network traffice badgea faltu me
            fullName:1,//flag h ye 1
            username:1,
            subscriberCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1

            // man kre to channel createdd ke createdAt bej skte ho
        }
    }
   ])

   if(!channel?.length){
     throw new ApiError(404,"channel does not exists")
   }

   return res
   .status(200)
   .json(new ApiResponce(200,channel[0],"User channel fetched successfully"))
})

// here nested pipeline ->as for watchhistory(user)-->video(find id) through lookup and then waha se (owner)(jo user hi h)to  find krna hoga jo user hi h
const getWatchHistory = asyncHandler(async(req,res)=>{
 //interview q->req.user._id yaha objectId('qwerty') string milah h sirf objectId nahi mongoose pr kr khud isko to iske liye 
 // hm id ko convert kr let hai
 const user = await User.aggregate([
    {
        $match:{ // req.user._id  direct nahi use hoga converted kiye h ayha (mogoose ke object id bnana h)
            _id:new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from:"Video",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            //subpipline use or populate method v hot h pr av subpipline
            pipeline:[
               {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                        {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                }
               },
               {
                // for fronted help not array hoga direct jo chaiye wo milega usko-->sidh usko object mil jayeah owner. krke values nikal lega 
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
               }
            ]
        }
    }
 ])

 return res.
 status(200)
 .json(
    new ApiResponce(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
    )
 )
})

export {registerUser,
    LoginUser,
    logoutUser,
    refreshAccesssToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}