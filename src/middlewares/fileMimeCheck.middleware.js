import { fileTypeFromFile } from 'file-type';

const checkValidMimeType = (req, res, next) => {
    const type = fileTypeFromFile(req.filePath);
    if (type && type.ext === 'mp4') {
        console.log('Valid file format')
    } else {
        console.log('Not a Valid file format')
        next();
    }
}