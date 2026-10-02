// assGenerator.js

function toAssTimestamp(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${h}:${String(m).padStart(2, '0')}:${s}`;
}

// function buildAssHeader(styleLine) {
//     return `[Script Info]
// Title: Auto-generated subtitles
// ScriptType: v4.00+
// PlayResX: 1280
// PlayResY: 720

// [V4+ Styles]
// Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
// ${styleLine}

// [Events]
// Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
// `;
// }


function buildAssHeader(styleLine) {
    return `[Script Info]
Title: Auto-generated subtitles
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}
function buildDialogueLine(segment) {
    const start = toAssTimestamp(segment.start);
    const end = toAssTimestamp(segment.end);
    const text = segment.text.trim();
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
}

function generateAssFile(segments, styleLine) {
    const header = buildAssHeader(styleLine);
    const dialogueLines = segments.map(buildDialogueLine).join('\n');
    return header + dialogueLines;
}

export { generateAssFile };