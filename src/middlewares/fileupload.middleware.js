import multer from 'multer';
import ApiError from '../utils/api-error.js';
import { nanoid } from 'nanoid'
import path from 'path'


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'storage/uploads');
    },

    // filename: (req, file, cb) => {
    //     try {
    //         const code = nanoid(6);
    //         console.log(code);
    //         cb(null, code + Date.now() + file.originalname);

    //     }
    //     catch (error) {
    //         console.log(`Error while sending file: ${error}`)
    //     }
    // }

    filename: (req, file, cb) => {
        const code = nanoid(6);
        const ext = path.extname(file.originalname); // just keep the extension, e.g. ".mp4"
        cb(null, `${code}${Date.now()}${ext}`);       // no spaces, no special characters
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
        cb(null, true)
    }
    else {
        cb(new ApiError(401, "File format is not supported"), false, {
            errorReason: "Here the code"
        })
    }
}


// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1000000 } // 1MB file size limit
// }).single('myFile');
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10000000 } //10 MB limit
})


export default upload;
