// import ApiError from "../../../Project management System/src/utils/api-error";
import ALIGNMENT_MAP from "./alignmentMap.js";
import { SUBTITLE_STYLES } from "./subtitlesStyles.js";
import TEXT_STYLE_MAP from "./textStyleMap.js";


function buildStyleLine({ styleId = 'bold-yellow', fontSize, textStyle, fontName, position }) {

    const preset = SUBTITLE_STYLES[styleId];
    if (!preset) {
        throw new Error(`Unknown style recived: ${styleId}`);
    }

    const finalFontName = fontName || 'Arial';
    const parsedFontSize = Number(fontSize);
    const finalFontSize = Number.isFinite(parsedFontSize) && parsedFontSize > 0
        ? parsedFontSize
        : 24;
    const finalTextStyle = TEXT_STYLE_MAP[textStyle] || TEXT_STYLE_MAP['normal']
    const finalAlignMent = ALIGNMENT_MAP[position] || ALIGNMENT_MAP['bottom'];
    return `Style: Default,${finalFontName},${finalFontSize},${preset.primaryColour},${preset.outlineColour},${preset.backColour},${finalTextStyle.bold},${finalTextStyle.italic},${preset.borderStyle},${preset.outline},0,${finalAlignMent},10,10,20,0`;

}


export default buildStyleLine;
