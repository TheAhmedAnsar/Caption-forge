import ffmpeg from 'fluent-ffmpeg';
import { start } from 'repl';

function extractAudio(videoPath, audioOutputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .audioFrequency(16000)
            .audioChannels(1)
            .format('wav')
            .on('error', (error) => reject(error))
            .on('end', () => resolve(audioOutputPath))
            .save(audioOutputPath);
    })
}

function burnAssSubtitles(videoPath, assPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .videoFilters(`ass=${assPath}`)
            .outputOptions('-c:a', 'copy')
            .on('start', (cmd) => console.log('FFMPEG COMMAND:', cmd))
            .on('error', (err) => reject(err))
            .on('end', () => resolve(outputPath))
            .save(outputPath);
    });
}


export {
    extractAudio,
    burnAssSubtitles

}