//@ts-ignore
import { monitorEventLoopDelay } from 'perf_hooks'
import * as THREE from 'three'

console.log("Version", THREE.REVISION)

const w = 800
const h = 400

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
    scene: THREE.Scene
    mesh: THREE.Points
    box: THREE.Mesh
    camera: THREE.PerspectiveCamera
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


        this.camera = new THREE.PerspectiveCamera();
        this.camera.position.z = 5;
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(w, h)
        this.container.appendChild(this.renderer.domElement);

        const MAX = 3000

        const getPos = ()=>{
            const x = rand(-1, 1)
            const y = rand(-1, 1)
            const z = rand(-1, 1)
            return {x, y, z}
        }

        const getPos2 = ()=>{
            let n = 0
            let p = getPos()
            while (n < 5 && Math.abs(p.x - p.y) > 0.1){
                p = getPos()
                n++
            }
            return p
        }
        
        const initialPositions = []
        const velocities = []
        const accelerations = []
        this.geo = new THREE.BufferGeometry()
        for(let i=0; i<MAX; i++) {

            const p = getPos2()

            const x = p.x
            const y = p.y
            const z = p.z

            initialPositions.push(x)
            initialPositions.push(y)
            initialPositions.push(z)
            velocities.push(rand(0, 0))
            velocities.push(0.0)
            velocities.push(0.0)
            accelerations.push(0)
            accelerations.push(0.0)
            accelerations.push(0)
        }
        this.b1 = new THREE.Float32BufferAttribute(initialPositions, 3)
        this.b2 = new THREE.Float32BufferAttribute(velocities, 3)
        this.b3 = new THREE.Float32BufferAttribute(accelerations, 3)

        this.geo.setAttribute('position', this.b1)
        this.geo.setAttribute('velocity', this.b2)
        this.geo.setAttribute('acceleration', this.b3)

        
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
uniform sampler2D u_texture;
void main() {

    //float r = 0.01;
    vec2 uv = position.xy;
    vec4 clr = texture2D(u_texture, uv);
    float _r = clr.a;

    //vec3 acc = acceleration * 0.5 * time * time;
    //vec3 vel = velocity * time;

    vec3 acc = vec3(0.0, 0.0, 0.0);
    vec3 vel = vec3(0.0, 0.0, 0.0);

    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(acc + vel + position, 1.0);
    gl_PointSize = 1.0;
}
`,

            fragmentShader: `
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });

        this.mesh = new THREE.Points(this.geo, mat)
        this.mesh.position.z = 2

        this.box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2, 2), new THREE.MeshBasicMaterial({color: "blue"}))

        var realLight = new THREE.PointLight(0xffffff, 0.9);
        realLight.position.set(0, 0, 10);
        
        this.scene.add(this.mesh)
        this.scene.add(this.box)
        this.scene.add(realLight)
        this.scene.add(this.camera)
        
        this.addListeners()
    }
  
    drawWind(){
        const maxDur = 75
        const maxSize = 100
        this.drawingContext.clearRect(0,0,w,h)
        this.wind.forEach((w)=>{
            let s = maxSize*(maxDur - w.t) / maxDur
            this.drawingContext.drawImage(this.pen, w.x, w.y, s, s)
            w.t++;
        })
        this.wind = this.wind.filter(w => w.t <= maxDur)

        
    }

    addListeners(){
        
        document.addEventListener('pointermove', (e) => {
            e.preventDefault()
            if(this.down){
                this.wind.push({x:e.pageX, y:e.pageY, t:0})
                if(this.wind.length >= 50){
                    this.wind.shift()
                }
            }
        });
        document.addEventListener('pointerdown', (e) => {
            this.down = true
        });
        document.addEventListener('pointerup', () => {
            this.down = false
        });
    }
    applyWind(){
        
        const samples = 10

        //console.log(this.b1.count,normalizedMouseX, normalizedMouseY)

        for ( let i = 0; i < this.b1.count; i ++ ) {

            const x = this.b1.getX(i)
            const y = this.b1.getY(i)
            const z = this.b1.getZ(i)

            const pos =  {x:(x + 1)/2, y: (y + 1)/2}

            pos.x *= w
            pos.y *= h

            pos.x = Math.round(pos.x)
            pos.y = Math.round(pos.y)
            
            const data =  this.drawingContext.getImageData(pos.x, pos.y, 1, 1).data;

          //  console.log(pos, data[0])

            const r = data[0];

            const disp = 0.01;

            if(r > 0){
                const D = 5;
                const dataA = this.drawingContext.getImageData(pos.x - D, pos.y, 1, 1).data;
                const dataB = this.drawingContext.getImageData(pos.x, pos.y - D, 1, 1).data;
                const dataC = this.drawingContext.getImageData(pos.x + D, pos.y, 1, 1).data;
                const dataD = this.drawingContext.getImageData(pos.x, pos.y + D, 1, 1).data;

                const maxIndex = getMaxIndex([dataA[0], dataB[0], dataC[0], dataD[0]])
                if(maxIndex === 0){
                    this.b1.setXYZ( i, x - disp, y, z);
                }
                if(maxIndex === 1){
                    this.b1.setXYZ( i, x, y + disp, z);
                }
                if(maxIndex === 2){
                    this.b1.setXYZ( i, x + disp, y, z);
                }
                if(maxIndex === 3){
                    this.b1.setXYZ( i, x, y - disp, z);
                }
               
            
            }


           

            
        }
    }
    animate(time: number){
        this.drawWind()
        this.applyWind()

        const delta = time - this.time;
        this.uniforms.time.value = delta/10
        this.time = time
        this.uniforms.u_texture.value = this.cTexture
        this.geo.attributes.position.needsUpdate = true

        this.geo.attributes.acceleration.needsUpdate = true
        this.renderer.render(this.scene, this.camera)

        requestAnimationFrame(this.animate)
    }
   

}















