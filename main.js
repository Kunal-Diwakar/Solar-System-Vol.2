import * as THREE from 'three';
import gsap from 'gsap';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background

// Set up the camera
const camera = new THREE.PerspectiveCamera(
	25, 
	window.innerWidth / window.innerHeight, 
	0.1, 
	100 
);
camera.position.z = 9; 

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
document.body.appendChild(renderer.domElement);

// Handle window resizing
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
});

// Set up PMREM generator for HDRI
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Load HDRI texture
new RGBELoader()
	.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/moonlit_golf_2k.hdr', function (texture) {
		const envMap = pmremGenerator.fromEquirectangular(texture).texture;
		scene.environment = envMap; 
		texture.dispose(); 
		pmremGenerator.dispose();
	});

// Define sphere properties
const radius = 1.3;
const segments = 64;
const textures = [
	"./csilla/color.png",
	"./earth/map.jpg",
	"./venus/map.jpg",
	"./volcanic/color.png"
];
const orbitRadius = 4.5;
const spheres = new THREE.Group();

// Load star texture
const starTextureLoader = new THREE.TextureLoader();
const starTexture = starTextureLoader.load('./stars.jpg'); 
starTexture.colorSpace = THREE.SRGBColorSpace; 

// Create star sphere
const starGeometry = new THREE.SphereGeometry(50, 64, 64); 
const starMaterial = new THREE.MeshBasicMaterial({
	map: starTexture,
	opacity: 0.5,
	side: THREE.BackSide 
});
const starSphere = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starSphere); 

const spheresMesh = [];

// Create planet spheres
for (let i = 0; i < 4; i++) {
	const textureLoader = new THREE.TextureLoader();
	const texture = textureLoader.load(textures[i]);
	texture.colorSpace = THREE.SRGBColorSpace; 

	const geometry = new THREE.SphereGeometry(radius, segments, segments); 
	const material = new THREE.MeshStandardMaterial({ map: texture });
	const sphere = new THREE.Mesh(geometry, material);

	spheresMesh.push(sphere);

	const angle = (i / 4) * (Math.PI * 2);
	sphere.position.x = orbitRadius * Math.cos(angle);
	sphere.position.z = orbitRadius * Math.sin(angle);

	spheres.add(sphere);
	spheres.rotation.x = 0.1;
	spheres.position.y = -0.9;
	scene.add(spheres);
}

let lastWheelTime = 0;
const throttleDelay = 2000;
let scrollcoutn = 0;

// Throttle wheel event handler
function throttleWheelHandler(event) {
	const currentTime = Date.now();
	if (currentTime - lastWheelTime >= throttleDelay) {
		lastWheelTime = currentTime;

		scrollcoutn = (scrollcoutn + 1) % 4;
		console.log(scrollcoutn);

		const headings = document.querySelectorAll(".heading");
		gsap.to(headings, {
			duration: 1,
			y: `-=${100}%`,
			ease: "power2.inOut",
		});

		gsap.to(spheres.rotation, {
			duration: 1,
			y: `-=${Math.PI / 2}%`,
			ease: "power2.inOut",
		})

		if (scrollcoutn === 0) {
			gsap.to(headings, {
				duration: 1,
				y: `0`,
				ease: "power2.inOut",
			});
		}
	}
}

window.addEventListener("wheel", throttleWheelHandler);

const clock = new THREE.Clock();

// Animation loop
function animate() {
	requestAnimationFrame(animate);
	for (let i = 0; i < spheresMesh.length; i++) {
		const sphere = spheresMesh[i];
		sphere.rotation.y = clock.getElapsedTime() * 0.05;
	}
	renderer.render(scene, camera);
}

// Start the animation loop
animate();
