import ApiResponse from '../utils/api-response.js'
import path from 'path'
import fs from 'fs';
import { burnAssSubtitles, extractAudio } from '../services/videoProcessor.js'
import { transcribeAudio } from '../services/transcriptionService.js';
import { generateAssFile } from '../utils/assGenerator.js'
import buildStyleLine from '../config/buildStyleLine.js';



const uploadFile = async (req, res) => {
    const videoPath = path.resolve(req.file.path);
    const filename = req.file.filename;
    const nameWithoutExt = path.basename(filename, path.extname(filename));

    const audioPath = path.resolve(path.join('storage', 'processing', `${nameWithoutExt}.wav`));
    await extractAudio(videoPath, audioPath)

    const segments = await transcribeAudio(audioPath);

    // const styleLine = "Style: Default,Arial,28,&H00FFFF&,&H000000&,&H00000000&,0,1,3,0,2,10,10,20,0";

    // const assContent = generateAssFile(segments, styleLine);
    const assPath = path.resolve(path.join('storage', 'processing', `${nameWithoutExt}.ass`));
    const { styleId, fontSize, fontName, position, textStyle } = req.body;

    const styleLine = buildStyleLine({ styleId, fontSize, fontName, position, textStyle });
    const assContent = generateAssFile(segments, styleLine);

    fs.writeFileSync(assPath, assContent);
    const assOutputPath = path.resolve(path.join('storage', 'output', `${nameWithoutExt}_subtitled.mp4`));
    await burnAssSubtitles(videoPath, assPath, assOutputPath);

    const outputFileName = path.basename(assOutputPath);
    return res.status(200).json(
        new ApiResponse(200, "success", "Video processed successfully!", {
            outputFileName,
            outputUrl: `/media/${encodeURIComponent(outputFileName)}`,
        })
    )
}


const listJobs = async (req, res) => {
    return res.json(new ApiResponse(200, "success", "The list of data will be here"))
}

export { listJobs, uploadFile }
