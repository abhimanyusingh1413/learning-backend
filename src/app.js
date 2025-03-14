import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
     origin:process.env.CORS_ORIGIN,
     credentials:true
}))

app.use(express.json({limit:"16kb"})); // for data from filling from 
app.use(express.urlencoded({extended:true,limit:"16kb"})) // data from url as abhimanyu+kumar  +  is used for space20%
app.use(express.static("public")) // data like photo and vedio static data and stored in public folder here code base 
app.use(cookieParser()) // user side cookies only read by serve and incode product based app me hot hai

//router import
import userRoutes from './routes/user.routers.js';

//routes declearation  app.get() nahi use kr skte h as controller and router ko import krna pad raha h dusre jagha se ye act as middleware ke tarah kr araha h, yahi syntax h
app.use("/api/v1/users",userRoutes) //standard practice for version and not collectring app.js ie prefix ka use 

// http://localhost:8000/api/v1/users/register 

export {app}