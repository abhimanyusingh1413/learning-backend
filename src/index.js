// require('dotenv').config({path:'./env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{

    app.on("error",(error)=>{
        console.log("ERROR App is not listening",error);
        throw error
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log(` ⚙️  Server is running at port:${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongoose db connection failed !!!",error);
})












// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

/* first approcch -> db connection not pollute the but colleter the index.js
// after db connection suing app for direct connection and listening also done.
import express from "express"
const app = express()


// iffy->  function of js for immediate responce of callback function of DB
// 2 point for db connection ->try and catch and asyn await use.
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/{DB_NAME}`)

        app.on("error",(error)=>{
            console.log("ERROR",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listing on ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR:",error)
        throw err
    }
})()
    */