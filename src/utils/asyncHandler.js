// for promises after db connect  -->called rapper fun use hoga baar baar jab v db connection krege to ek vairable form me bana liye ha isko utile folder me


// rapper or helper function for the controller thats it
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };
};

export { asyncHandler };

//higer order fun in js ->
//const asyncHandler = ()=>{}
//const asyncHandler = ()=>{  ()=>{}  }
//const asyncHandler = (func)=>()=>{} isme {} hata hua h 
//const asyncHandler = (func)=> async()=>{}

// from using try and catch
// const asyncHandler = (fn)=>async(req,res,next)
// =>{
//     try{
//         await fn(req,res,next)
//     } catch(error){
//         res.status(err.code || 500).json({
//             succcess:false,
//             message:err.message
//         })
//     }
// } 
