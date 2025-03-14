import multer from "multer";


//middleware method 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,"./public/temp") // file in store in public ->temp
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)  use for production provide unique file name but we not use it right now.

    //   cb(null, file.fieldname + '-' + uniqueSuffix) // file.original we use same work provide unique name but we use orginal name 
      cb(null, file.originalname)
    }
  })
  
//   export  const upload = multer({ storage: storage })
  export  const upload = multer({ 
    storage,
 })
 //middleware ko import krege routes me