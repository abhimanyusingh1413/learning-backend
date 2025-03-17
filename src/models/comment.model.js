import mongoose,{connect, Schema} from "mongoose";

//ye bas functionality deta h ki kaha se kaha tak vedio dege y akuch v for better performane reduce memory usage thoda det aloading ke liya 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content:{
            types:String,
            required:true
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
    },
    {
        timestamps:true
    }
)


commentSchema.plugin(mongooseAggregatePaginate)

export  const Comment = mongoose.model("Comment",commentSchema)