
//https://stackoverflow.com/questions/39073857/drawing-with-sugar


import {Brush} from "./brush"
import Filter from './filter'
//@ts-ignore
import {canvasBuf} from "./push2"

const w = 512
const h = 512

const sandImage = new Image()
sandImage.src = "./new/sand.jpg"

const wetSandImage = new Image()
wetSandImage.src = "./new/wet.jpg"

const ridgesImage = new Image()
ridgesImage.src = "./new/noise.png"



const makeCanvas = (name:string, size:number)=>{
    const c = document.createElement("canvas")
    c.id = name
    document.body.appendChild(c)
    c.width = size
    c.height = size
    return c
}

export class Sand2{
    
    finalCanvas: HTMLCanvasElement
    finalContext: CanvasRenderingContext2D

    drawingCanvas: HTMLCanvasElement
    drawingContext: CanvasRenderingContext2D

    edgeCanvas:HTMLCanvasElement
    edgeContext: CanvasRenderingContext2D

    sandCanvas:HTMLCanvasElement
    sandContext: CanvasRenderingContext2D

    wetSandCanvas:HTMLCanvasElement
    wetSandContext: CanvasRenderingContext2D

    ridgesCanvas:HTMLCanvasElement
    ridgesContext: CanvasRenderingContext2D

    pos:{x:number, y:number} = {x:0, y:0}

    start:{x:number, y:number} = {x:0, y:0}

    down:boolean = false

    constructor(){
       
        this.init()
    }
    init(){
        this.finalCanvas = makeCanvas("finalCanvas", w)
        this.finalContext = this.finalCanvas.getContext('2d')
        
        this.drawingCanvas = makeCanvas("drawingCanvas", w)
        this.drawingContext = this.drawingCanvas.getContext('2d')

        this.edgeCanvas = makeCanvas("edgeCanvas", w)
        this.edgeContext = this.edgeCanvas.getContext('2d')

        this.sandCanvas = makeCanvas("sandCanvas", w)
        this.sandContext = this.sandCanvas.getContext('2d')

        this.wetSandCanvas = makeCanvas("wetSandCanvas", w)
        this.wetSandContext = this.wetSandCanvas.getContext('2d')

        this.ridgesCanvas = makeCanvas("ridgesCanvas", w)
        this.ridgesContext = this.ridgesCanvas.getContext('2d')

        document.body.appendChild(canvasBuf)

        this.addListeners()
    }
    onDraw(){
        //new Filter(this.drawingCanvas, this.edgeContext).run()
        
        this.wetSandContext.clearRect(0,0,w,h)
        this.wetSandContext.drawImage(wetSandImage, 0, 0, w, h)
        this.wetSandContext.globalCompositeOperation = "destination-in"
        this.wetSandContext.drawImage(this.drawingCanvas, 0, 0, w, h)
        this.wetSandContext.globalCompositeOperation = "source-over"

        this.ridgesContext.clearRect(0,0,w,h)
        this.ridgesContext.drawImage(ridgesImage, 0, 0, w, h)
        this.ridgesContext.globalCompositeOperation = "destination-in"
        this.ridgesContext.drawImage(this.edgeCanvas, 0, 0, w, h)
        this.ridgesContext.globalCompositeOperation = "source-over"

        this.finalContext.clearRect(0,0,w,h)
        this.finalContext.drawImage(sandImage, 0, 0, w, h)
        this.finalContext.drawImage(this.wetSandCanvas, 0, 0, w, h)
        this.finalContext.drawImage(this.ridgesCanvas, 0, 0, w, h)
    }
   
    addListeners(){
        const pen = new Brush({
            alpha:1,
            hardness:1,
            noise:1,
            radius:10
        })

        document.addEventListener('pointermove', (e) => {
            e.preventDefault()
            if(this.down){
                const dx = Math.abs(this.pos.x - e.pageX)
                const dy = Math.abs(this.pos.y - e.pageY)
                const speed = Math.sqrt(dx*dx + dy*dy)
                let scale = 1;
                const maxSpeed = 4
                const minSpeed = 1
                const maxScale = 1
                const minScale = 0.5
                if(speed > maxSpeed){
                    scale = minScale
                }
                else if(speed < minSpeed){
                    scale = maxScale
                }
                else{
                    scale = (speed - minSpeed) / (maxSpeed - minSpeed) // 0 to 1
                    scale = scale * (minScale - maxScale) + maxScale
                }
                let numPoints = Math.max(Math.min(Math.ceil(speed/4), 20), 1) / scale;
                const size = pen.getSize()
                const penImg = pen.getCanvasImageSource()
                const drawingSize = 16
                const drawAt = (p:{x:number, y:number})=>{
                    const drawingW = drawingSize*scale
                    this.drawingContext.drawImage(penImg, 0, 0, size, size, p.x - drawingW/2, p.y - drawingW/2, drawingW, drawingW)
                }
                for(let i = 1; i <= numPoints; i++){   
                    const t = i/numPoints
                    const x = this.pos.x + t*(e.pageX - this.pos.x)
                    const y = this.pos.y + t*(e.pageY - this.pos.y)
                    const p = {x, y}
                    drawAt(p)
                }
                this.onDraw()
                this.pos.x = e.pageX
                this.pos.y = e.pageY
            }
        });
        document.addEventListener('pointerdown', (e) => {
            this.start.x = e.pageX
            this.start.y = e.pageY
            this.pos.x = e.pageX
            this.pos.y = e.pageY
            this.down = true
        });
        document.addEventListener('pointerup', () => {
            this.down = false
        });
    }
}

