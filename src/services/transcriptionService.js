import { nodewhisper } from "nodejs-whisper";
import { parseSrt } from "../utils/srtParser.js";
import { parse } from "dotenv";

async function transcribeAudio(audioPath) {
    //     await nodewhisper(audioPath, {
    //     modelName: 'base',
    //     autoDownloadModelName: 'base',
    //     whisperOptions: {
    //       outputInSrt: true,
    //     },
    //   });

    await nodewhisper(audioPath, {
        modelName: 'base',
        autoDownloadModelName: 'base',
        whisperOptions: {
            outputInSrt: true
        }

    });

    const srtPath = `${audioPath}.srt`;
    const segments = parseSrt(srtPath);

    return segments;

}


export { transcribeAudio };