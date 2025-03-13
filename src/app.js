import express from "express";
import cors from "cors";
import cookieParser from "cookies-parser";

const app = express();

app.use(cors({
     origin:porcess.env.CORS_ORIGIN,
     credentials:true
}))

app.use(express.json({limit:"16kb"})); // for data from filling from 
app.use(express.urlencoded({extended:true,limit:"16kb"})) // data from url as abhimanyu+kumar  +  is used for space20%
app.use(express.static("public")) // data like photo and vedio static data and stored in public folder here code base 
app.use(express.cookieParser()) // user side cookies only read by serve and incode product based app me hot hai

export {app}