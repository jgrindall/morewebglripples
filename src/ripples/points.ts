//@ts-ignore

import * as THREE from 'three'

console.log("Version", THREE.REVISION)

const w = 800
const h = 400

var width = 9
var height = 4

const rand = (a:number, b:number):number=>{
    return Math.random()*(b - a) + a
}

const getMaxIndex = (a:number[]):number => {
    let maxIndex = -1
    let maxValue = -Infinity
    for(let index = 0; index < a.length; index++){
        const val = a[index]
        if(val > maxValue){
            maxValue = val
            maxIndex = index
        }
    }
    return maxIndex;
}

export class Points{

    container: any
    down: boolean
    currentPos: any = {x:Infinity, y:Infinity}
    scene: THREE.Scene
    mesh: THREE.Points
    box: THREE.Mesh
    camera: THREE.OrthographicCamera
    renderer: THREE.WebGLRenderer
    uniforms: any
    geo: THREE.BufferGeometry
    
    
    drawingCanvas: HTMLCanvasElement
    drawingContext: CanvasRenderingContext2D


    windCanvas: HTMLCanvasElement
    windContext: CanvasRenderingContext2D
    wind:any[] =[]

    cTexture: THREE.CanvasTexture
    b1: THREE.Float32BufferAttribute
    b2: THREE.Float32BufferAttribute
    b3: THREE.Float32BufferAttribute
    b4: THREE.Float32BufferAttribute
    time:number = 0;


    pen: HTMLImageElement


    constructor(){
        this.animate = this.animate.bind(this)
        this.load()
        this.pen = new Image()
        this.pen.src = "./pen.png"

    }
    load(){
        this.init();
        this.animate(0);
    }
    init(){
        this.container = document.getElementById('container');

        this.drawingCanvas = document.createElement("canvas")
        document.body.appendChild(this.drawingCanvas)
        this.drawingCanvas.width = w
        this.drawingCanvas.height = h
        this.drawingContext = this.drawingCanvas.getContext('2d');
        this.cTexture = new THREE.CanvasTexture(this.drawingCanvas);

        this.windCanvas = document.createElement("canvas")
        document.body.appendChild(this.windCanvas)
        this.windCanvas.width = w
        this.windCanvas.height = h
        this.windContext = this.windCanvas.getContext('2d');

        
        this.camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 )
        this.camera.position.z = 4.25;
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(w, h)
        this.container.appendChild(this.renderer.domElement);

        const MAX = 10000

        const getPos = ()=>{
            const x = rand(-width/2, width/2)
            const y = rand(-height/2, height/2)
            
            return {x, y, z:0}
        }

        const getPos2 = ()=>{
            let n = 0
            let p = getPos()
            /**
            while (n < 5 && Math.abs(p.x - p.y) > 0.1){
                p = getPos()
                n++
            }
            **/
            return p
        }
        
        const initialPositions = []
        const velocities = []
        const accelerations = []
        const colors = []
        this.geo = new THREE.BufferGeometry()
        for(let i = 0; i < MAX; i++) {

            const p = getPos2()

            const x = p.x
            const y = p.y
            const z = p.z

            initialPositions.push(x)
            initialPositions.push(y)
            initialPositions.push(z)
            velocities.push(0)
            velocities.push(0)
            velocities.push(0)
            accelerations.push(0)
            accelerations.push(0)
            accelerations.push(0)

            colors.push(rand(0, 1))
            colors.push(0.1)
            colors.push(0.1)
        }
        this.b1 = new THREE.Float32BufferAttribute(initialPositions, 3)
        this.b2 = new THREE.Float32BufferAttribute(velocities, 3)
        this.b3 = new THREE.Float32BufferAttribute(accelerations, 3)
        this.b4 = new THREE.Float32BufferAttribute(colors, 3)

        this.geo.setAttribute('position', this.b1)
        this.geo.setAttribute('velocity', this.b2)
        this.geo.setAttribute('acceleration', this.b3)
        this.geo.setAttribute('color', this.b4)
        
        this.uniforms = {
            time: {
                type: "f",
                value: 12.0
            },
            u_texture: {
                type: "t",
                value: this.cTexture
            }
        }

        const mat = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,

            vertexShader: `
uniform float time;
attribute vec3 velocity;
attribute vec3 acceleration;
varying vec3 vColor;
void main() {

    vec2 uv = position.xy;
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = color.r * 5.0;
}
`,

            fragmentShader: `
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 1.0);
}
`,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });

        this.mesh = new THREE.Points(this.geo, mat)
        
        this.box = new THREE.Mesh(
            new THREE.PlaneGeometry(8.9, 3.9, 2, 2),
            new THREE.MeshBasicMaterial({color: "rgb(236,204,162)"})
        )
        
        var realLight = new THREE.PointLight(0xffffff, 0.9);
        realLight.position.set(0, 0, 10);
        
        this.scene.add(this.mesh)
        this.scene.add(this.box)
        this.scene.add(realLight)
        this.scene.add(this.camera)
        
        this.addListeners()
    }
  
    drawWind(){
        const maxDur = 20
        const maxSize = 30
        this.drawingContext.clearRect(0,0,w,h)
        this.wind.forEach((w)=>{
            let s = maxSize*(maxDur - w.t) / maxDur

            this.drawingContext.beginPath()
            this.drawingContext.arc(w.x, w.y, s, 0, 2 * Math.PI)
            this.drawingContext.closePath()

            this.drawingContext.fillStyle = `rgba(
                ${Math.floor(255 - 6 * s)},
                ${Math.floor(255 - 6 * s)},
                ${Math.floor(255 - 6 * s)},
                ${Math.floor(255 - 6 * s)})`;
            this.drawingContext.fill()
            w.t++;
        })
        this.wind = this.wind.filter(w => w.t <= maxDur)
        
    }

    addListeners(){
        
        document.addEventListener('pointermove', (e) => {
            e.preventDefault()
            if(this.down){
                this.currentPos = {
                    x:e.pageX,
                    y:e.pageY,
                    t:0
                }
                this.wind.push(this.currentPos)
                if(this.wind.length >= 2){
                    this.wind.shift()
                }
            }
        });
        document.addEventListener('pointerdown', (e) => {
            this.down = true
        });
        document.addEventListener('pointerup', () => {
            this.down = false
            this.currentPos = {
                x:Infinity,
                y:Infinity,
                t:0
            }
        });
    }
    applyWind(){
        
        const b = this.geo.attributes.position

        var positions = b.array

        for(let i = 0; i < positions.length/3; i++){

            const x = b.getX(i)
            const y = b.getY(i)
            const z = b.getZ(i)

            const pos =  {
                x: (x + width/2) / width,
                y: (y + height/2) / height
            } // 0 to 1

            pos.x *= w
            pos.y *= h
            pos.y = h - pos.y

            pos.x = Math.round(pos.x)
            pos.y = Math.round(pos.y)

            pos.x = Math.min(Math.max(0, pos.x), this.drawingCanvas.width)
            pos.y = Math.min(Math.max(0, pos.y), this.drawingCanvas.height)

            const data =  this.drawingContext.getImageData(pos.x, pos.y, 1, 1).data;
            const r = data[0];
            const disp = -0.05;

            if(r > 0){
                const D = 5;
                const dataA = this.drawingContext.getImageData(pos.x - D, pos.y, 1, 1).data;
                const dataB = this.drawingContext.getImageData(pos.x, pos.y - D, 1, 1).data;
                const dataC = this.drawingContext.getImageData(pos.x + D, pos.y, 1, 1).data;
                const dataD = this.drawingContext.getImageData(pos.x, pos.y + D, 1, 1).data;

                const maxIndex = getMaxIndex([dataA[0], dataB[0], dataC[0], dataD[0]])
                if(maxIndex === 0){
                    b.setXYZ( i, x - disp, y, z);
                }
                if(maxIndex === 1){
                    b.setXYZ( i, x, y + disp, z);
                }
                if(maxIndex === 2){
                    b.setXYZ( i, x + disp, y, z);
                }
                if(maxIndex === 3){
                   b.setXYZ( i, x, y - disp, z);
                }
            }
        }

    }
    applyWind2(){
        const b = this.geo.attributes.position
        const v = this.geo.attributes.velocity
        const a = this.geo.attributes.acceleration

        var positions = b.array
       
        const delta = 0.01

        for(let i = 0; i < positions.length/3; i++){

            const x = b.getX(i)
            const y = b.getY(i)
            const z = b.getZ(i)

            const pos =  {
                x: (x + width/2) / width,
                y: (y + height/2) / height
            } // 0 to 1

            pos.x *= w
            pos.y *= h
            pos.y = h - pos.y

            pos.x = Math.round(pos.x)
            pos.y = Math.round(pos.y)

            pos.x = Math.min(Math.max(0, pos.x), this.drawingCanvas.width)
            pos.y = Math.min(Math.max(0, pos.y), this.drawingCanvas.height)
            

            const vx = v.getX(i)
            const vy = v.getY(i)
            const vz = v.getZ(i)

            const ax = a.getX(i)
            const ay = a.getY(i)
            const az = a.getZ(i)

            b.setXYZ( i, x + vx*delta, y + vy*delta, 0)

            const dx = pos.x - this.currentPos.x
            const dy = pos.y - this.currentPos.y
            const dist = Math.sqrt(dx*dx + dy*dy)

            //console.log(pos, this.currentPos, dx, dy, dist)

            const maxAccn = 512
            const fingerSize = 30

            if(dist < fingerSize && ay == 0 && az == 0){
                const accnNorm = {x: dx/dist, y: dy/dist}
                const requiredLength = (1 - dist/fingerSize) * maxAccn
                const finalAccn = {x: accnNorm.x * requiredLength, y:accnNorm.y*requiredLength}
                a.setXYZ(i, finalAccn.x, -finalAccn.y, 0)
            }
            else{
                a.setXYZ(i, 0, 0, 0)
            }

            //console.log("v incr", ax, ay)

            const fallOff = 0.8

            v.setXYZ(i, (vx + ax*delta)*fallOff, (vy + ay * delta)*fallOff, 0)




            //update a and v
            

                    
        }
    }
    animate(time: number){
        //this.drawWind()
        //this.applyWind()
        this.applyWind2()
        const delta = time - this.time;
        this.uniforms.time.value = delta/10
        this.time = time
        this.uniforms.u_texture.value = this.cTexture
        this.geo.attributes.position.needsUpdate = true
        this.renderer.render(this.scene, this.camera)
        this.geo.attributes.position.needsUpdate = true
        requestAnimationFrame(this.animate)
    }
   

}















