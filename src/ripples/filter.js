
const w = 512
const h = 512

const noiseCanvas = document.createElement("canvas")
noiseCanvas.width = w
noiseCanvas.height = h

let noiseData
let noiseCtx

const noise = new Image()
noise.onload = () => {
    noiseCtx = noiseCanvas.getContext('2d')
    noiseCanvas.getContext('2d').drawImage(noise, 0, 0, noise.width, noise.height, 0, 0, w, h)
    noiseData = noiseCtx.getImageData(0, 0, 512, 512)
}
noise.src = "./noise2.jpg" 
/*
* @param data - input pixels data
* @param idx - the index of the central pixel
* @param w - image width (width*4 in case of RGBA)
* @param m - the gradient mask (for Sobel=[1, 2, 1])
*/

function conv3x(data, idx, w, m) {
    return (m[0] * data[idx - w - 4] + m[1] * data[idx - 4] + m[2] * data[idx + w - 4]
        - m[0] * data[idx - w + 4] - m[1] * data[idx + 4] - m[2] * data[idx + 4 + 4]);
}

function conv3y(data, idx, w, m) {
    return (m[0] * data[idx - w - 4] + m[1] * data[idx - w] + m[2] * data[idx - w + 4]
        - (m[0] * data[idx + w - 4] + m[1] * data[idx + w] + m[2] * data[idx + w + 4]));
}

const copyPixel = (buff, noiseData, i)=>{
    buff[i] = 0//noiseData.data[i]
    buff[i + 1] = 0//noiseData.data[i + 1]
    buff[i + 2] = 0//noiseData.data[i + 2]
    buff[i + 3] = 255;

}

function gradient_internal(pixels, mask) {
    var data = pixels.data;
    var w = pixels.width * 4;
    var l = data.length - w - 4;
    var buff = new data.constructor(new ArrayBuffer(data.length));

    for (var i = w + 4; i < l; i += 4) {
        var dx = conv3x(data, i, w, mask);
        var dy = conv3y(data, i, w, mask);
        const rgb = Math.sqrt(dx * dx + dy * dy);

        if (rgb > 10 && noiseData) {

            copyPixel(buff, noiseData, i)


        }
        else {
            buff[i] = 0
            buff[i + 1] = 0
            buff[i + 2] = 0
            buff[i + 3] = 0;
        }
    }
    return buff;
}


function gradient(canvas, dest, matrix = [1, 2, 1]) {
    var context = canvas.getContext('2d');
    var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    var destPixels = dest.getImageData(0, 0, canvas.width, canvas.height)
    const buffer = gradient_internal(pixels, matrix);
    destPixels.data.set(buffer)
    dest.putImageData(destPixels, 0, 0);
}

export default gradient