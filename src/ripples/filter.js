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

const setPixelBlack = (buff, i)=>{
    buff[i] = 0
    buff[i + 1] = 0
    buff[i + 2] = 0
    buff[i + 3] = 255;
}
export default class Filter{
    
    constructor(canvas, dest, matrix = [1, 2, 1], alphaCutOff = 10){
        this.canvas = canvas
        this.dest = dest
        this.matrix = matrix
        this.alphaCutOff = alphaCutOff
    }

    _gradient_internal(){
        const data = pixels.data
        const w = pixels.width * 4
        const l = data.length - w - 4
        const buff = new data.constructor(new ArrayBuffer(data.length))
        for (let i = w + 4; i < l; i += 4) {
            const dx = conv3x(data, i, w, this.matrix)
            const dy = conv3y(data, i, w, this.matrix)
            const rgb = Math.sqrt(dx * dx + dy * dy)
            if (rgb > this.alphaCutOff) {
                setPixelBlack(buff, i)
            }
            else {
                buff[i] = 0
                buff[i + 1] = 0
                buff[i + 2] = 0
                buff[i + 3] = 0
            }
        }
        return buff
    }

    run(){
        const context = this.canvas.getContext('2d')
        const pixels = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
        const destPixels = this.dest.getImageData(0, 0, canvas.width, canvas.height)
        const buffer = this._gradient_internal(pixels)
        destPixels.data.set(buffer)
        dest.putImageData(destPixels, 0, 0)
    }

}
