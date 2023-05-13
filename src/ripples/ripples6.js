import * as THREE from 'three'

let container, camera, textureCamera, textureScene, scene, renderer, renderer2, textureRenderTarget, textureRenderTarget1, uniforms, mesh;

var width = 512
var height = 512

let m = {
	x:0,
	y:0
}

function init() {

    // make the scene we will render to the RenderTarget
    // make the scene we will render to the real canvas

    container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    renderer2 = new THREE.WebGLRenderer();
    renderer2.setSize(width, height);

    container.appendChild(renderer.domElement);
    container.appendChild(renderer2.domElement);

    
    // make the render target scene
    textureScene = new THREE.Scene();
    textureCamera = new THREE.PerspectiveCamera(
        75,
        1,
        0.1,
        1000);

    textureCamera.position.z = 5

    textureRenderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    });

	textureRenderTarget1 = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    });

    textureCamera.position.z = 2;
    textureCamera.lookAt(new THREE.Vector3(0, 0, 0))
    textureScene.add(textureCamera)

    uniforms = {
        u_time: {
            type: "f",
            value: 0.0
        },
		u_mouse_down: {
			type: "i",
			value: 0 
		},
		u_mouse_pos: {
			type: "v2",
			value: new THREE.Vector2(0, 0) 
		},
		u_resolution: {
			type: "v2",
			value: new THREE.Vector2(512, 512) 
		},
		u_texture:{
			type: "t",
			value: null
		}
    };

	document.addEventListener('pointermove', (e) => {
		//this.m.x = (e.pageX - w / 2) / h
		//this.m.y = (e.pageY - h / 2) / h * -1

		m.x = e.pageX
		m.y = 512 - e.pageY

	})
	document.addEventListener('pointerdown', () => {
		uniforms.u_mouse_down.value = 1;
	})
	document.addEventListener('pointerup', () => {
		uniforms.u_mouse_down.value = 0;
	})


    //the one we render off-screen
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
varying vec2 vUV;

void main() {
	vUV = uv;

	// Convert UV to absolute XY.
	vec2 xy = uv * 2.0 - 1.0;

	// Draw at end of clip space to allow occlusion.
	gl_Position = vec4(position, 1.0);
}`,
        
        fragmentShader: `
varying vec2 vUV;
uniform float u_time;
uniform int u_mouse_down;
uniform vec2 u_mouse_pos;
uniform sampler2D u_texture;
uniform vec2 u_resolution;

void main() {

	vec2 uv = gl_FragCoord.xy / u_resolution;

	vec4 clr = texture2D(u_texture, uv);

	//float t = length(gl_FragCoord.xy) / 10.0;

	float dx = abs(gl_FragCoord.x - u_mouse_pos.x);
    float dy = abs(gl_FragCoord.y - u_mouse_pos.y);
    
	float x = 0.0;
	//sin(t + u_time) / 3.0;

	if(u_mouse_down == 1 && dx < 10.0 && dy < 20.0) {
        x = 0.95;
    }

	gl_FragColor = clr;
	gl_FragColor.x = x;
}
    `
    });


	const bufferGeometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(-1, -1, 0),
		new THREE.Vector3(1, -1, 0),
		new THREE.Vector3(1, 1, 0),

		new THREE.Vector3(-1, -1, 0),
		new THREE.Vector3(1, 1, 0),
		new THREE.Vector3(-1, 1, 0),
		
	]);

    var box = new THREE.Mesh(bufferGeometry, shaderMaterial);

	textureScene.add(box);
	//textureScene.add(box2);

    // make the real scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 2;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    var map = new THREE.TextureLoader().load('tiling-mosaic.png' );

    var material = new THREE.MeshPhongMaterial({
        shininess: 0.1,
        map,
        specular: 0.7,
        bumpMap: textureRenderTarget.texture,
        displacementMap: textureRenderTarget.texture,
        displacementScale: 0.1,
        bumpScale: 0.1
    });
    
    material.side = THREE.DoubleSide;
    // the real scene has a mesh and a light
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 64, 64), material);
    mesh.position.set(0, 0, 0);
  
    var light = new THREE.PointLight(0xffffff, 0.9);
    light.position.set(0, 0, 10);

    scene.add(mesh);
    scene.add(light);
    
}


function animate() {

	uniforms.u_texture.value = textureRenderTarget1.texture
	uniforms.u_mouse_pos.value.x = m.x
	uniforms.u_mouse_pos.value.y = m.y
	uniforms.u_time.value += 0.05
	
	renderer.setRenderTarget(textureRenderTarget)
	renderer.render(textureScene, textureCamera)
	renderer.setRenderTarget(null)
	renderer.render(textureScene, textureCamera)
	
	renderer.render(scene, camera)

	mesh.rotation.x += 0.0001
	mesh.rotation.y += 0.00006
	mesh.rotation.z += -0.0005

	//renderer2.render(textureScene, textureCamera)

	//swap

	let t = textureRenderTarget
	textureRenderTarget = textureRenderTarget1
	textureRenderTarget1 = t
	
	requestAnimationFrame(animate);
}

export default function(){
	init()
	animate()
}



