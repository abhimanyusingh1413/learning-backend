import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinary url
        required:true,
    },
    coverImage:{
        type:String, //cloudinary url 
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Vedio"
        }
    ],
    password:{
        type:String,  //but not at this time but use in encripted form
        required:[true,'password is required'] //custome msg

    },
    refreshToken:{
        type:String,
    } 
},
{
    timestamps:true
}
);

//password encript->middleware hooks(pre) use krte hai  insted of callback function use function as we use (this) keyword and next flag
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password =  await bcrypt.hash(this.password,10)
    next()
})

//custom method banya h yaha se passward check kr skte h sahi h ki nahi user pass jayeg ana ki hash pswd ye v bcrpt krega
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}

//JWT TOKEN GENRATE 
// accesstoken are short lived
userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        //payloads
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


// refreshtoken are longlived store in data base and user for file without login and generates access token for req if both server and req as same refreshtoken
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        //payloads
        {
            _id:this._id
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema);