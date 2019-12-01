// export function setSizes(screenXY: IScreen, imageXY: IImage, image: JQuery<HTMLImageElement>): JQuery<HTMLImageElement> {
//     if (imageXY.width > screenXY.width || imageXY.height > screenXY.height) {
//         const ratio = imageXY.width / imageXY.height > screenXY.width / screenXY.height ? imageXY.width / screenXY.width : imageXY.height / screenXY.height;
//         imageXY.width /= ratio;
//         imageXY.height /= ratio;
//     }
//     const cssHeight = imageXY.height * imageXY.gutterFactor;
//     const cssWidth = imageXY.width * imageXY.gutterFactor;
//     const cssLeft = ($(window).width()! - cssWidth ) / 2;

//     image.css({
//         'width': cssWidth + 'px',
//         'height': cssHeight + 'px',
//         'left':  cssLeft + 'px'
//     });

//     return image;
// }
