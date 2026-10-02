import { Router } from 'express';
import { listJobs, uploadFile } from '../controllers/files.controllers.js';
import upload from '../middlewares/fileupload.middleware.js';

const router = Router();

router.get('/jobs', listJobs)

router.post('/jobs', upload.single('file'), uploadFile)

export default router;
