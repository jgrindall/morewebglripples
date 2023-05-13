//@ts-ignore
import * as THREE from 'three'
//@ts-ignore
import vertexShader from "./vShader"
//@ts-ignore
import fragmentShader from "./fShader3"

console.log("Version", THREE.REVISION)

let divisor = 0.1;
const w = 800
const h = 400

export class Ripples{
    noise_texture:any
    rtTexture1: any
    rtTexture2: any
    environment: any
    realScene:any
    realCamera: any
    pooltex:THREE.Texture
    container:any;
    camera:any
    scene:any
    renderer:any;
    renderer2:any;
    uniforms:any;
    downTime:any;
    newmouse = {
        x: 0,
        y: 0
    };
    constructor(){
        this.animate = this.animate.bind(this)
        this.load()
    }
    makeTextures(){
        this.rtTexture1 = new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
        this.rtTexture2 = new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
    }
    update(canvas: HTMLCanvasElement){
        this.pooltex.dispose()
        this.pooltex = new THREE.CanvasTexture(canvas)
        this.pooltex.wrapS = THREE.RepeatWrapping
        this.pooltex.wrapT = THREE.RepeatWrapping
        this.pooltex.minFilter = THREE.NearestMipMapNearestFilter
        this.pooltex.needsUpdate = true
        this.uniforms.u_texture.value = this.pooltex
    }
    load(){
        let loader = new THREE.TextureLoader();
        loader.load(
            './env_lat-lon.png',
            (tex:any) => {
                this.environment = tex;
                this.environment.wrapS = THREE.RepeatWrapping;
                this.environment.wrapT = THREE.RepeatWrapping;
                this.environment.minFilter = THREE.NearestMipMapNearestFilter;

                loader.load(
                    './tiling-mosaic.png',
                    (tex:THREE.Texture) => {
                        console.log(tex)
                        this.pooltex = tex;
                        this.pooltex.wrapS = THREE.RepeatWrapping;
                        this.pooltex.wrapT = THREE.RepeatWrapping;
                        this.pooltex.minFilter = THREE.NearestMipMapNearestFilter;

                        this.init();
                        this.animate(0);
                    }
                )
            }
        );
    }
    init(){
        this.container = document.getElementById('container');
        this.camera = new THREE.PerspectiveCamera();
        this.camera.position.z = 1;
        this.scene = new THREE.Scene();
        var geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, -1, 0),
            new THREE.Vector3(1, -1, 0),
            new THREE.Vector3(1, 1, 0),
    
            new THREE.Vector3(-1, -1, 0),
            new THREE.Vector3(1, 1, 0),
            new THREE.Vector3(-1, 1, 0),
            
        ]);
    
        this.makeTextures()
    
        this.uniforms = {
            u_time: { type: "f", value: 1.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2(w, h) },
            u_buffer: { type: "t", value: this.rtTexture1.texture },
            u_texture: { type: "t", value: this.pooltex },
            u_environment: { type: "t", value: this.environment },
            u_mouse: { type: "v3", value: new THREE.Vector3() },
            u_frame: { type: "i", value: -1.0 },
            u_renderpass: { type: 'b', value: false }
        };
    
        var material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader
        });
        material.extensions.derivatives = true;
    
        var mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.container.appendChild(this.renderer.domElement);

        this.renderer2 = new THREE.WebGLRenderer({alpha: true});
        this.container.appendChild(this.renderer2.domElement);


        this.realScene = new THREE.Scene();

        var map = new THREE.TextureLoader().load('tiling-mosaic.png' );

        var realMaterial = new THREE.MeshPhongMaterial({
            shininess: 0.1,
            color: "red",
            map,
            specular: 0.7,
            bumpMap: this.rtTexture2.texture,
            displacementMap: this.rtTexture2.texture,
            displacementScale: 0.9,
            bumpScale: 0.9
        });
        
        realMaterial.side = THREE.DoubleSide;
        // the real scene has a mesh and a light
        var realMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75, 64, 64), realMaterial);
        realMesh.position.set(0, 0, 0);
      
        var realLight = new THREE.PointLight(0xffffff, 0.9);
        realLight.position.set(0, 0, 10);

        this.realCamera = new THREE.PerspectiveCamera();
        this.realCamera.position.z = 1;

        this.realScene.add(realMesh);
        this.realScene.add(realLight);
        this.realScene.add(this.realCamera);


        this.onWindowResize();
        this.addListeners()
    }
    addListeners(){
        document.addEventListener('pointermove', (e) => {
            e.preventDefault()
            //console.log(e.pageX, e.pageY)
            this.newmouse.x = (e.pageX - w / 2) / h;
            this.newmouse.y = (e.pageY - h / 2) / h * -1;
        });
        document.addEventListener('pointerdown', () => {
            this.downTime = Date.now();
            this.uniforms.u_mouse.value.z = 1;
        });
        document.addEventListener('pointerup', () => {
            this.uniforms.u_mouse.value.z = 0;
        });
    }
    animate(delta: number){

        const d = Date.now() - this.downTime
        if(d > 500){
            this.uniforms.u_mouse.value.z = 0;
        }
        

        this.uniforms.u_frame.value++;
        this.uniforms.u_mouse.value.x += (this.newmouse.x - this.uniforms.u_mouse.value.x) * divisor;
        this.uniforms.u_mouse.value.y += (this.newmouse.y - this.uniforms.u_mouse.value.y) * divisor;
        this.uniforms.u_time.value = delta * 0.0005;
        this.renderer.render(this.scene, this.camera);
        this.renderTexture();

        requestAnimationFrame(this.animate);
    }
    swap(){
        let t = this.rtTexture1
        this.rtTexture1 = this.rtTexture2;
        this.rtTexture2 = t;
    }
    renderTexture(){

        this.uniforms.u_buffer.value = this.rtTexture2.texture;
        this.uniforms.u_renderpass.value = true;

        this.renderer.setRenderTarget(this.rtTexture1);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
       
        this.swap()
        this.uniforms.u_buffer.value = this.rtTexture1.texture;
        this.uniforms.u_renderpass.value = false;
        this.renderer.render(this.scene, this.camera);


        //this.renderer.render(this.realScene, this.realCamera);

    }
    onWindowResize() {
        this.renderer.setSize(w, h);
        this.makeTextures()
        this.uniforms.u_frame.value = -1;
    }

}

