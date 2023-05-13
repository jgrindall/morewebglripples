type BrushSettings = {
    radius: number
    hardness: number
    alpha: number
    noise: number
}

const w = 64
const h = 64

const getClr = (clr:string, _alpha:number) => `rgba(${clr}, ${_alpha})`
        

export class Brush {
    private brushCtx: CanvasRenderingContext2D
    private settings: BrushSettings
    private canvas: HTMLCanvasElement

    private canvas2: HTMLCanvasElement
    private brushCtx2: CanvasRenderingContext2D

    private canvas3: HTMLCanvasElement
    private brushCtx3: CanvasRenderingContext2D

    noise: HTMLImageElement

    constructor(settings: BrushSettings) {
        this.settings = settings
        this.canvas = document.createElement('canvas')
        this.canvas.id = "brush"
        
        this.canvas.width = w
        this.canvas.height = h
        
        this.brushCtx = this.canvas.getContext('2d')
        this.canvas2 = document.createElement('canvas')
        this.canvas2.id = "brush2"
        this.brushCtx2 = this.canvas2.getContext('2d')
        this.canvas2.width = w
        this.canvas2.height = h


        this.canvas3 = document.createElement('canvas')
        this.canvas3.id = "brush3"
        
        this.canvas3.width = w
        this.canvas3.height = h
        this.canvas3.width = w
        this.canvas3.height = h

        this.brushCtx3 = this.canvas3.getContext('2d')


        document.body.appendChild(this.canvas)
        document.body.appendChild(this.canvas2)
        document.body.appendChild(this.canvas3)

      

      


        this.noise = new Image()
        this.noise.onload = ()=>{
            this.redraw()
        }
        this.noise.src = "./noise.png" 

        this.redraw()
    }

    public getSize():number{
        return w;
    }

    public getCanvasImageSource(): CanvasImageSource{
        return this.canvas
    }

    public getCanvasImageSource2(): CanvasImageSource{
        return this.canvas2
    }
    
    public getCanvasImageSource3(): CanvasImageSource{
        return this.canvas3
    }

    createGradient(clr: string, alpha:number): CanvasGradient {
        const gradient = this.brushCtx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2)
        
        gradient.addColorStop(0, getClr(clr, alpha))
        gradient.addColorStop(0.7, getClr(clr, alpha))
        gradient.addColorStop(0.8, getClr(clr, 0))
        
       

        return gradient
    }

    updateSettings(settings: BrushSettings) {
        this.settings = settings
        this.redraw()
    }

    redraw() {
        const gradient = this.createGradient("100, 100, 100", 1);
        const gradient2 = this.createGradient("66, 45, 22", 0.4);
        this.brushCtx.clearRect(0, 0, w, h)



        this.brushCtx.globalCompositeOperation = 'source-over'

        //Do whatever drawing you want. In your case, draw your image.
        //this.brushCtx.drawImage(this.noise, 0, 0);

        //this.brushCtx.fillStyle = '#fff';
        //this.brushCtx.globalCompositeOperation = 'destination-in'
        //this.brushCtx.beginPath()
        //this.brushCtx.arc(w/2, h/2, w/2, 0, 2 * Math.PI)
        //this.brushCtx.closePath()
        //this.brushCtx.fill()

        this.brushCtx.globalCompositeOperation = 'source-over'

        this.brushCtx.fillStyle = gradient
        this.brushCtx.fillRect(0, 0, w, h)

        
        this.brushCtx2.clearRect(0, 0, w, h)
        this.brushCtx2.fillStyle = gradient2
        this.brushCtx2.fillRect(0, 0, w, h)

      
    }
}