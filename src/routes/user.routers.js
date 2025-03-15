import { Router } from "express";
import {LoginUser, registerUser,logoutUser, refreshAccesssToken } from "../controllers/user.controller.js";
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
            maxcount:1
        }
    ]),
    registerUser
)

router.route("/login").post(LoginUser)

//secure routes             middleware inject niche verifyjwt
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccesssToken)

export default router