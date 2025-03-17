import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    name:{
        types:String,
        required:true
    },
    description:{
        types:String,
        required:true
    },
    videos:[
        {
            types:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
},{timestamps:true})

export const Playlist = mongoose.model("Playlist",playlistSchema)