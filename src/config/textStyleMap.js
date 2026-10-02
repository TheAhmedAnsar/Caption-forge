const TEXT_STYLE_MAP = {
    normal: { bold: 0, italic: 0 },
    bold: { bold: -1, italic: 0 },
    italic: { bold: 0, italic: -1 },
    'bold-italic': { bold: -1, italic: -1 }
}


export default TEXT_STYLE_MAP;