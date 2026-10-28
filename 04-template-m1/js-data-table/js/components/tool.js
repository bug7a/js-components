/* Bismillah */

/*

TOOL: small helpers of the samples.

tool.useImageAsText(params, editCreatedImage): an image as a piece of HTML text (an icon in a title of the table).
- params: { fontSize (the size of the place of the image, 20), outerSpaceLeft, outerSpaceRight }
- editCreatedImage(image): sets the image (image.load(file), image.width, image.height).
- Returns the HTML text. The image object itself is removed: only its file and size are used.

*/

"use strict";
const tool = {};

tool.useImageAsText = function (params = {}, editCreatedImage) {

    const placeSize = params.fontSize || 20;
    const spaceLeft = params.outerSpaceLeft || 0;
    const spaceRight = params.outerSpaceRight || 0;

    // WHY: the image is made only to be read here; `that` of the page must not change
    const savedThat = that;
    const savedPrevThat = prevThat;

    const image = Icon(0, 0);
    editCreatedImage(image);
    const file = image.imageElement.getAttribute("src") || "";
    const width = image.width;
    const height = image.height;
    image.remove();

    that = savedThat;
    prevThat = savedPrevThat;
    previousThat = savedPrevThat;

    const placeStyle = "display: inline-block; position: relative; vertical-align: middle;" +
        " width: " + placeSize + "px; height: " + placeSize + "px;" +
        " margin-left: " + spaceLeft + "px; margin-right: " + spaceRight + "px;";
    const imageStyle = "position: absolute;" +
        " left: " + ((placeSize - width) / 2) + "px; top: " + ((placeSize - height) / 2) + "px;" +
        " width: " + width + "px; height: " + height + "px;";

    return '<span style="' + placeStyle + '"><img src="' + basic.escapeHtml(file) + '" alt="" style="' + imageStyle + '"></span>';

};
