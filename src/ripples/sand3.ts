//https://stackoverflow.com/questions/39073857/drawing-with-sugar

import * as THREE from 'three'
//@ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log("Version", THREE.REVISION, OrbitControls)

const w = 512
const h = 512

const normalWidth = 256
const normalHeight = 256

const makeCanvas = (name:string, size:number)=>{
    const c = document.createElement("canvas")
    c.id = name
    document.body.appendChild(c)
    c.width = size
    c.height = size
    return c
}

export class Sand3{
    container:any;
    camera:any
    scene:any
    renderer:any;
    controls: any

    drawingCanvas: HTMLCanvasElement
    drawingContext: CanvasRenderingContext2D

    material:any
    mesh:THREE.Mesh
    down:boolean = false
    
    start: {x:number, y:number} = {x:0, y:0}
    pos: {x:number, y:number} = {x:0, y:0}

    sandTexture: THREE.Texture
    bumpTexture: THREE.Texture
    normalTexture: THREE.Texture

    constructor(){
        this.animate = this.animate.bind(this)
        this.makeTextures()
        this.init();
        this.animate(0);
    }
    makeTextures(){
        this.sandTexture = new THREE.TextureLoader().load('./new/sand.jpg') 
        this.bumpTexture = new THREE.TextureLoader().load('./new/bump.png')
        this.normalTexture = new THREE.TextureLoader().load('./new/NormalMap.png')

        this.bumpTexture.wrapS = THREE.RepeatWrapping
        this.bumpTexture.wrapT = THREE.RepeatWrapping
        this.bumpTexture.minFilter = THREE.NearestMipMapNearestFilter
        this.bumpTexture.needsUpdate = true


    }
    init(){
        this.container = document.getElementById('container');
        this.camera = new THREE.OrthographicCamera()

        this.camera.position.z = 200.5;
        this.camera.position.x = 1;
        this.camera.position.y = 1;
        this.camera.lookAt(new THREE.Vector3(0,0,0))
        this.scene = new THREE.Scene();
      
        var geometry = new THREE.PlaneGeometry(1.5, 1.5, 512, 512)
      
        var material = new THREE.MeshPhongMaterial({
            map: this.sandTexture,
            normalMap: this.normalTexture
        })

        material.side = THREE.DoubleSide
        
        this.mesh = new THREE.Mesh(geometry, material)

        const dLight = new THREE.DirectionalLight(0xD7C26E, 0.3)
        const aLight = new THREE.AmbientLight(0xFFFFFF, 0.8)

        dLight.target = this.mesh
        dLight.position.set(10, 0, 10)
        aLight.position.set(0, 0, 10)
        
        dLight.lookAt(new THREE.Vector3(0,0,0))
        this.scene.add( dLight )
        this.scene.add( aLight )
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

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.enabled = false

        this.addListeners()
    }
    onDraw(){

    }
    addListeners(){
        document.getElementById("draw").addEventListener("click", ()=>{
            this.controls.enabled = false
        })
        document.getElementById("move").addEventListener("click", ()=>{
            this.controls.enabled = true
        })
        document.addEventListener('pointermove', (e) => {
            if(this.controls.enabled){
                return
            }
        });
        document.addEventListener('pointerdown', (e) => {
            this.down = true
        });
        document.addEventListener('pointerup', () => {
            this.down = false
        });
    }
    animate(delta: number){
        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(this.animate)
    }

}

