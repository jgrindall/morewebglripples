//@ts-ignore
import * as THREE from 'three'
import {Brush} from "./brush"
import {height2normal} from "./heightToNormals"
import gradient from './filter'
console.log("Version", THREE.REVISION)

const w = 512
const h = 512

const normalWidth = 256
const normalHeight = 256

export class Sand{
    noise_texture:any
    container:any;
    camera:any
    scene:any
    renderer:any;

    drawingCanvas: HTMLCanvasElement
    drawingContext: CanvasRenderingContext2D


    fDrawingCanvas: HTMLCanvasElement
    fDrawingContext: CanvasRenderingContext2D

    nCanvas2:HTMLCanvasElement 
    nContext2:CanvasRenderingContext2D 

    nCanvas: HTMLCanvasElement
    nContext: CanvasRenderingContext2D

    mCanvas: HTMLCanvasElement
    mContext: CanvasRenderingContext2D

    texture:any
    nTexture:any
    mTexture:any
    
    material:any
    mesh:THREE.Mesh
    down:boolean = false
    
    start: {x:number, y:number} = {x:0, y:0}
    pos: {x:number, y:number} = {x:0, y:0}


    constructor(){
        this.animate = this.animate.bind(this)
        this.load()
    }
    makeTextures(){
        
    }
    load(){
        this.init();
        this.animate(0);
    }
    init(){
        this.container = document.getElementById('container');
        this.camera = new THREE.OrthographicCamera();
        this.camera.position.z = 200.5;
        this.camera.position.x = 1;
        this.camera.position.y = 1;
        this.camera.lookAt(new THREE.Vector3(0,0,0))
        this.scene = new THREE.Scene();
        var geometry = new THREE.PlaneGeometry(1.5, 1.5, 512, 512)

        this.drawingCanvas = document.createElement("canvas")
        document.body.appendChild(this.drawingCanvas)
        this.drawingCanvas.width = w
        this.drawingCanvas.height = h
        this.drawingContext = this.drawingCanvas.getContext('2d');


        this.fDrawingCanvas = document.createElement("canvas")
        document.body.appendChild(this.fDrawingCanvas)
        this.fDrawingCanvas.width = w
        this.fDrawingCanvas.height = h
        this.fDrawingContext = this.fDrawingCanvas.getContext('2d');


        this.nCanvas = document.createElement("canvas")
        document.body.appendChild(this.nCanvas)
        this.nCanvas.width = normalWidth
        this.nCanvas.height = normalHeight
        this.nContext = this.nCanvas.getContext('2d')

        this.nCanvas2 = document.createElement("canvas")
        document.body.appendChild(this.nCanvas2)
        this.nCanvas2.width = normalWidth
        this.nCanvas2.height = normalHeight
        this.nContext2 = this.nCanvas2.getContext('2d')

        this.mCanvas = document.createElement("canvas")
        document.body.appendChild(this.mCanvas)
        this.mCanvas.width = w
        this.mCanvas.height = h
        this.mContext = this.mCanvas.getContext('2d')

        this.drawingContext.fillStyle = "rgb(255,255,255)"
        this.drawingContext.fillRect(0, 0, w, h)

        this.texture = new THREE.CanvasTexture(this.drawingCanvas)
        this.nTexture = new THREE.CanvasTexture(this.nCanvas)
        this.mTexture = new THREE.CanvasTexture(this.mCanvas)
    
        var material = new THREE.MeshLambertMaterial({
            map: this.mTexture,
            displacementMap: this.texture,
            displacementScale: -2.0,
            normalMap: this.nTexture,
            normalScale: new THREE.Vector2(0.0, 5.0)
        })

        material.side = THREE.DoubleSide
        
        this.mesh = new THREE.Mesh(geometry, material)

        const dLight = new THREE.DirectionalLight(0xD7C26E, 0.8)
        const dLight2 = new THREE.DirectionalLight(0xD7C26E, 0.8)

        dLight.target = this.mesh
        dLight.position.set(10, 0, 10)
        dLight2.target = this.mesh
        dLight2.position.set(-10, 0, 10)
        dLight.lookAt(new THREE.Vector3(0,0,0))
        dLight2.lookAt(new THREE.Vector3(0,0,0))
        this.scene.add( dLight )
        this.scene.add( dLight2 )

        const lts = [dLight, dLight2]

        lts.forEach(dLight=>{
            dLight.castShadow = true
            dLight.shadow.bias = -0.003
            
            dLight.shadow.mapSize.width = 512
            dLight.shadow.mapSize.height = 512
            
            dLight.shadow.camera.left = -5
            dLight.shadow.camera.right = 5
            dLight.shadow.camera.top = -2
            dLight.shadow.camera.bottom = 2
            dLight.shadow.camera.near = 1
            dLight.shadow.camera.far = 10
        })

  

        this.scene.add(this.mesh);
        
        this.renderer = new THREE.WebGLRenderer({
            alpha: true
        })
        this.renderer.setSize(w, h)
        this.container.appendChild(this.renderer.domElement)

        this.renderer.shadowMap.enabled = true

        this.mesh.castShadow = true
        this.mesh.receiveShadow = true


        this.scene.add(new THREE.CameraHelper(this.camera)) 

        this.loadCanvas()
        this.addListeners()
    }
    onDraw(){

        gradient(this.drawingCanvas, this.fDrawingContext)


        this.nContext2.drawImage(this.drawingCanvas, 0, 0, w, h, 0, 0, normalWidth, normalHeight)
        height2normal(this.nContext2, this.nContext)
        this.texture.needsUpdate = true
        this.nTexture.needsUpdate = true
        this.mTexture.needsUpdate = true
    }
    loadCanvas(){
        const sand = new Image()
        sand.src = "./grey2.jpg"
        sand.onload = ()=>{
            this.drawingContext.drawImage(sand, 0, 0)
            this.onDraw()
        }

        const sand2 = new Image()
        sand2.src = "./sand.jpg"
        sand2.onload = ()=>{
            this.mContext.drawImage(sand2, 0, 0)
            this.mTexture.needsUpdate = true
        }
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
                
                console.log(speed);

                //scale = 1

                let numPoints = Math.max(Math.min(Math.ceil(speed/4), 20), 1) / scale;

                const size = pen.getSize()

                const penImg = pen.getCanvasImageSource()
                const penImg2 = pen.getCanvasImageSource2()
                const penImg3 = pen.getCanvasImageSource3()

                const drawingSize = 16

                const drawAt = (p:{x:number, y:number})=>{
                    const drawingW = drawingSize*scale
                    this.drawingContext.drawImage(penImg, 0, 0, size, size, p.x - drawingW/2, p.y - drawingW/2, drawingW, drawingW)
                    this.mContext.drawImage(penImg2, 0, 0, size, size, p.x - drawingW/2, p.y - drawingW/2, drawingW, drawingW)

                    const mp = {
                        x: (p.x + this.pos.x)/2,
                        y:(p.y + this.pos.y)/2
                    }

                    const dx = p.x - this.pos.x
                    const dy = p.y - this.pos.y

                    const drawingSize2 = 16

                    let x = mp.x - dy/2 - drawingSize2/2
                    let y = mp.y + dx/2 - drawingSize2/2

                    x = p.x - drawingW/2;
                    y = p.y - drawingW/2;
                    

                    //this.drawingContext.drawImage(penImg3, 0, 0, size, size, x, y, drawingSize2, drawingSize2)
                }

                //numPoints = 1

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
    animate(delta: number){

        this.renderer.render(this.scene, this.camera)
        this.mesh.rotation.x += 0.001
        //this.mesh.rotation.y -= 0.0013
        this.mesh.rotation.z += 0.0022

        requestAnimationFrame(this.animate)
    }
   

}

