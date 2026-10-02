// const fs = require('fs');
import fs from 'fs'
function srtTimeToSeconds(srtTime) {
    // srtTime format: "00:00:02,840"
    const [hms, ms] = srtTime.split(',');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s + Number(ms) / 1000;
}

function parseSrt(srtFilePath) {
    const content = fs.readFileSync(srtFilePath, 'utf-8');
    // split into blocks separated by blank lines
    const blocks = content.trim().split(/\r?\n\r?\n/);
    console.log(`This is blocks: ${blocks}`)

    return blocks.map(block => {
        const lines = block.split(/\r?\n/);
        // lines[0] = index number, lines[1] = timestamp line, lines[2+] = text (can be multi-line)
        const [startStr, endStr] = lines[1].split(' --> ');
        // const text = lines.slice(2).join(' ').trim();
        const text = lines.slice(2).join(' ').replace(/♪/g, '')
        console.log(`This is startStr ${startStr}, endStr ${endStr}: ${text}`)

        return {
            start: srtTimeToSeconds(startStr.trim()),
            end: srtTimeToSeconds(endStr.trim()),
            text
        };
    });

}

export { parseSrt }