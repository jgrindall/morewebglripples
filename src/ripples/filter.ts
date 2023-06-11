//@ts-ignore
import seedrandom from "seedrandom"

const jag = new Image()
jag.src = "./jagged.png"

const jSize = 32

/*
* @param data - input pixels data
* @param idx - the index of the central pixel
* @param w - image width (width*4 in case of RGBA)
* @param m - the gradient mask (for Sobel=[1, 2, 1])
*/
function conv3x(data:Uint8ClampedArray, i:number, w:number, m:ConvMatrix) {
    return (m[0] * data[i - w - 4] + m[1] * data[i - 4] + m[2] * data[i + w - 4]
        - m[0] * data[i - w + 4] - m[1] * data[i + 4] - m[2] * data[i + 4 + 4]);
}

function conv3y(data:Uint8ClampedArray, i:number, w:number, m:ConvMatrix) {
    return (m[0] * data[i - w - 4] + m[1] * data[i - w] + m[2] * data[i - w + 4]
        - (m[0] * data[i + w - 4] + m[1] * data[i + w] + m[2] * data[i + w + 4]));
}

const setPixelBlack = (buff:Uint8ClampedArray, i:number)=>{
    buff[i] = 0
    buff[i + 1] = 0
    buff[i + 2] = 0
    buff[i + 3] = 255;
}

type ConvMatrix = [number, number, number]

export default class Filter{

    private canvas: HTMLCanvasElement
    private dest: HTMLCanvasElement
    private matrix: ConvMatrix
    private alphaCutOff:number
    private points:any[]
    private width:number
    private height:number
    private length:number
    
    
    constructor(canvas: HTMLCanvasElement, dest: HTMLCanvasElement, matrix:ConvMatrix = [1, 2, 1], alphaCutOff = 10){
        this.canvas = canvas
        this.dest = dest
        this.matrix = matrix
        this.alphaCutOff = alphaCutOff
        this.points = []

        this.width = this.canvas.width
        this.height = this.canvas.height
        this.length = this.width * this.height * 4
    }

    _gradient_internal(pixels: ImageData){

        var rng = seedrandom('hello.')

        const data = pixels.data
        
        const buff = new Uint8ClampedArray(this.length)
        for (let i = 0; i < this.length; i += 4) {
            const n = i/4

            const x = n % this.width
            const y = Math.floor(n/this.width)

            //console.log(i, x, y)

            if(x === 0 || x === this.width || y === 0 || y === this.height){
                continue
            }

            const r = rng()

            const dx = conv3x(data, i, this.width * 4, this.matrix)
            const dy = conv3y(data, i, this.width * 4, this.matrix)
            const rgb = Math.sqrt(dx * dx + dy * dy)
            if (rgb > this.alphaCutOff) {
                setPixelBlack(buff, i)
                if(r < 0.01){
                    const scale = r * 100
                    this.points.push([x, y, scale])
                }
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
        const destContext = this.dest.getContext('2d')
        const pixels = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
        const destPixels = destContext.getImageData(0, 0, this.canvas.width, this.canvas.height)
        const buffer = this._gradient_internal(pixels)
        destPixels.data.set(buffer)
        destContext.putImageData(destPixels, 0, 0)
        this.points.forEach(p=>{
            const w = jSize * p[2]
            destContext.drawImage(jag, 0, 0, jSize, jSize, p[0] - w/2, p[1] - w/2, w, w)
            destContext.drawImage
        })
        
    }

}
