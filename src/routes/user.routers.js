import { Router } from "express";
import {
    LoginUser,
    registerUser,
    logoutUser,
    refreshAccesssToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

//adding middlewares "jate hue mil ke jana mere se ->iska kaam h" yaha pe upload h jo method use ho raha uske phale lelo
router.route("/register").post(
    upload.fields([
        {
            name:"avatar", // jab frontend ka filed banega to same name hoga yahi.
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(LoginUser)

//secure routes             middleware inject niche verifyjwt
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccesssToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)

// multiple middleware hoga single file 
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)


//param se lege to /c/:username ye username se hi le rahe the 
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router