import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // nodejs me present rahata hai fileSysm (unlink for dele)method hai

    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_CLOUD_SECRET // Click 'View API Keys' above to copy your API secret
    });

    // function for orgnaised file upload -->kud banya hai method for file upload
    const uploadOnCloudinary = async (localFilePath)=>{
        try {
            if(!localFilePath) return null
            //upload the file on cloudnary
            const responce = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            //file has been uploaded successfull
            console.log("File has been uploaded on cloudinary",responce.url);
            return responce 
        } catch (error) {
            fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed.
            return null;
        }
    }

    export {uploadOnCloudinary}
