//https://webgl-shaders.com/js/shader-example-evolve.js
//https://discourse.threejs.org/t/pass-renderer-output-as-input-texture-to-next-frame-interation/5021/2

//@ts-ignore
import * as THREE from 'three'
import fragmentShader3 from "./fShader3"

var w = 512
var h = 512
let divisor = 0.1;

const vertexShader =  `
varying vec2 vUV;

void main() {
    vUV = uv;
    // Convert UV to absolute XY.
    vec2 xy = uv * 2.0 - 1.0;
    // Draw at end of clip space to allow occlusion.
    gl_Position = vec4(xy, 1.0, 1.0);
}`

export class Ripples3{
    container: HTMLDivElement
    renderer: THREE.WebGLRenderer
    camera: any
    textureCamera:any
    textureScene: any
    scene:any
    renderer2:any
    renderer3:any
    texture:any
    textureRenderTarget:any
    rtTexture1:any
    rtTexture2:any
    uniforms: any
    uniforms2: any
    newmouse:any = {x:0, y:0}
    constructor(){
        this.render = this.render.bind(this)
        setTimeout(()=>{
            this.init()
        }, 500)
        //this.init()
    }
    addListeners(){
        document.addEventListener('pointermove', (e) => {
            e.preventDefault()
            //console.log(e.pageX, e.pageY)
            this.newmouse.x = (e.pageX - w / 2) / h;
            this.newmouse.y = (e.pageY - h / 2) / h * -1;
        });
        document.addEventListener('pointerdown', () => {
            this.uniforms.u_mouse.value.z = 1;
        });
        document.addEventListener('pointerup', () => {
            this.uniforms.u_mouse.value.z = 0;
        });
    }
    init(){

        // make the scene we will render to the RenderTarget
        // make the scene we will render to the real canvas
    
        this.container = document.getElementById('container') as HTMLDivElement
    
        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setSize(w, h)
    
        this.container.appendChild(this.renderer.domElement)

        this.rtTexture1 = new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType,
            minFilter: THREE.NearestMipMapNearestFilter
        })

        this.rtTexture2 = new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType,
            minFilter: THREE.NearestMipMapNearestFilter
        })
        
        // make the render target scene
        this.textureScene = new THREE.Scene();
        this.textureCamera = new THREE.PerspectiveCamera(
            75,
            1,
            0.1,
            1000)
    
        this.textureCamera.position.z = 5
    
        this.textureCamera.position.z = 2;
        this.textureCamera.lookAt(new THREE.Vector3(0, 0, 0))
        this.textureScene.add(this.textureCamera)
    
        this.uniforms = {
            u_time: {
                type: "f",
                value: 0.0
            },
            u_resolution: {
                type: "v2",
                value: new THREE.Vector2()
            },
            u_buffer: {
                type: "t",
                value: this.rtTexture2.texture
            },
            u_mouse: {
                type: "v3",
                value: new THREE.Vector3()
            },
            u_frame: {
                type: "i",
                value: -1.0
            }
        }
    
        //the one we render off-screen
        const textureMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader: fragmentShader3
        })  
    
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 16, 16), textureMaterial)
        this.textureScene.add(plane)
    
        // make the real scene
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(
            75,
            1,
            0.1,
            1000);
        this.camera.position.z = 2;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0))
        this.scene.add(this.camera)
    
        var map = new THREE.TextureLoader().load('./tiling-mosaic.png')
    
        var material = new THREE.MeshPhongMaterial({
            shininess: 0.1,
            map,
            specular: 0.5,
            //bumpMap: this.textureRenderTarget.texture,
            //displacementMap: this.textureRenderTarget.texture,
            //normalMap: textureRenderTarget.texture,
            displacementScale: 0.2,
            bumpScale: 0.2
        })
        
        material.side = THREE.DoubleSide
        // the real scene has a mesh and a light
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 16, 16), material)
        mesh.position.set(0, 0, 0)
        
        var light = new THREE.PointLight(0xffffff, 0.9)
        light.position.set(0, 0, 10)
    
        this.scene.add(mesh)
        this.scene.add(light)
    
        this.render()
    }
    render(){
        // setRenderTarget?
        
        this.uniforms.u_time.value += 0.05
        this.uniforms.u_resolution.value.x = w
        this.uniforms.u_resolution.value.y = h
        this.uniforms.u_mouse.value.x += (this.newmouse.x - this.uniforms.u_mouse.value.x) * divisor
        this.uniforms.u_mouse.value.y += (this.newmouse.y - this.uniforms.u_mouse.value.y) * divisor
        

        this.uniforms.u_buffer.value = this.rtTexture1.texture;

		// Render the shader scene
		
        
        //this.renderer.render(this.textureScene, this.textureCamera, this.textureRenderTarget, true);
        //this.renderer.render(this.scene, this.camera);
        
        //this.renderer2.render(this.textureScene, this.textureCamera)
        requestAnimationFrame(this.render)
    }
}


////////////

