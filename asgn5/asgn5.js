import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { MinMaxGUIHelper } from './minMaxGUIhelper.js';
import { ColorGUIHelper } from './colorGUIhelper.js';



function main() {

	const canvas = document.querySelector( '#c' );
	const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );

	// Physically-based rendering setup
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;

	const fov = 45;
	const aspect = 2; // the canvas default
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	camera.position.set( 0, 10, 20 );

	function updateCamera() {
		camera.updateProjectionMatrix();
	}

	const gui = new GUI();
	gui.add( camera, 'fov', 1, 180 ).onChange( updateCamera );
	const minMaxGUIHelper = new MinMaxGUIHelper( camera, 'near', 'far', 0.1 );
	gui.add( minMaxGUIHelper, 'min', 0.1, 50, 0.1 ).name( 'near' ).onChange( updateCamera );
	gui.add( minMaxGUIHelper, 'max', 0.1, 100, 0.1 ).name( 'far' ).onChange( updateCamera );

	const controls = new OrbitControls( camera, canvas );
	controls.target.set( 0, 5, 0 );
	controls.update();

	const scene = new THREE.Scene();

	{
		// scene.background = new THREE.Color( 'blue' );
		const loader = new THREE.CubeTextureLoader();
		const skyboxTexture = loader.load([
			'skybox/px.png',  // positive X
			'skybox/nx.png',  // negative X
			'skybox/py.png',  // positive Y
			'skybox/ny.png',  // negative Y
			'skybox/pz.png',  // positive Z
			'skybox/nz.png',  // negative Z
		]);
		scene.background = skyboxTexture;
	}

	{

		const planeSize = 40;

		const loader = new THREE.TextureLoader();
		const texture = loader.load( 'https://threejs.org/manual/examples/resources/images/checker.png' );
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		const repeats = planeSize / 2;
		texture.repeat.set( repeats, repeats );

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: texture,
			side: THREE.DoubleSide,
		} );
		const mesh = new THREE.Mesh( planeGeo, planeMat );
		mesh.rotation.x = Math.PI * - .5;
		scene.add( mesh );

	}

	{

		const skyColor = 0xB1E1FF; // light blue
		const groundColor = 0xB97A20; // brownish orange
		const intensity = 3;
		const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
		scene.add( light );

	}

	{
		const color = 0xFF0000;
		const intensity = 1.5;
		const light = new THREE.AmbientLight( color, intensity );
		scene.add( light );
	}

	{
		const dirLight = new THREE.DirectionalLight(0xffffff, 5);
		dirLight.position.set(5, 10, 7.5);
		scene.add(dirLight);
	}

	{
		const loader = new GLTFLoader();
		loader.load('objs/couch.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(6, 6, 6);
			model.position.set(8, 0, 0);
			scene.add(model);
		});
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/loveseat.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(5, 5, 5);
			model.rotation.y = THREE.MathUtils.degToRad(113); // Rotate 135° to the right
			model.position.set(-2.5, 0, 10);
			scene.add(model);
		});
	}
	{
		const tvGroup = new THREE.Group(); // Create a group to hold both models

		const loader1 = new GLTFLoader();
		loader1.load('objs/tvstand.glb', (gltf) => {
			const stand = gltf.scene;
			stand.scale.set(6, 6, 6);
			stand.position.set(1.5, -2.2, 0);
			tvGroup.add(stand); // Add to group
		});

		const loader2 = new GLTFLoader();
		loader2.load('objs/tv.glb', (gltf) => {
			const tv = gltf.scene;
			tv.scale.set(6, 6, 6);
			tv.position.set(0, 3.15, 5);
			tvGroup.add(tv); // Add to group
		});

		// Add the group to the scene
		scene.add(tvGroup);

		// Optional: you can now transform the group as a whole
		tvGroup.position.set(17, 0, 17);   // move both objects
		tvGroup.scale.set(0.9, 0.9, 0.9);   // move both objects
		tvGroup.rotation.y = THREE.MathUtils.degToRad(-140); 
	}

	{
		const tvGroup2 = new THREE.Group(); // Create a group to hold both models

		const loader1 = new GLTFLoader();
		loader1.load('objs/sidetable.glb', (gltf) => {
			const stand = gltf.scene;
			stand.scale.set(2.3,3,2.5);
			stand.position.set(-3, 2.2, 0);
			tvGroup2.add(stand); // Add to group
		});

		const loader2 = new GLTFLoader();
		loader2.load('objs/tv.glb', (gltf) => {
			const tv = gltf.scene;
			tv.scale.set(3.75, 4, 4);
			tv.position.set(-3, 2.15, 0);
			tvGroup2.add(tv); // Add to group
		});

		// Add the group to the scene
		scene.add(tvGroup2);
		tvGroup2.rotation.y = THREE.MathUtils.degToRad(180);
		tvGroup2.position.set(2, 0, 17);   // move both objects
		tvGroup2.scale.set(1.3,1.3,1.3);   // move both objects
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/diningtable.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(5.5, 5.25, 5.25);
			// model.rotation.y = THREE.MathUtils.degToRad(113); // Rotate 135° to the right
			model.position.set(5, 0, -12);
			scene.add(model);
		});
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/chair.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(8,8,8);
			// model.rotation.y = THREE.MathUtils.degToRad(113); // Rotate 135° to the right
			model.position.set(3, 0, -15);
			scene.add(model);
		});
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/chair.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(8,8,8);
			// model.rotation.y = THREE.MathUtils.degToRad(113); // Rotate 135° to the right
			model.position.set(9, 0, -15);
			scene.add(model);
		});
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/circletable.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(10, 8, 10);
			// model.rotation.y = THREE.MathUtils.degToRad(113); // Rotate 135° to the right
			model.position.set(-15, 0, 6);
			scene.add(model);
		});
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/leatherchair.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(4,4,4);
			model.rotation.y = THREE.MathUtils.degToRad(113); // Rotate 135° to the right
			model.position.set(-15, 0, 15);
			scene.add(model);
		});
	}
	{
		const loader = new GLTFLoader();
		loader.load('objs/shelf.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(3,5,5);
			model.rotation.y = THREE.MathUtils.degToRad(-90); // Rotate 135° to the right
			model.position.set(-7, 0, 17);
			scene.add(model);
		});
	}

	// Sphere
	{
		const radius = 0.7;
		const widthSegments = 32;
		const heightSegments = 16;
		const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
		const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
		const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		sphere.position.x = -3;
		sphere.position.y = 10;
		scene.add(sphere);
	}

	let cylinder; // declare a variable to hold the cylinder
	// Cylinder
	{
		const radiusTop = 0.5;
		const radiusBottom = 0.5;
		const height = 1.5;
		const radialSegments = 32;
		const cylinderGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
		const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0x44ff44 });
		cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
		cylinder.position.x = 0;
		cylinder.position.y = 10;
		scene.add(cylinder);
	}


	// Cube with Texture
	{
		const boxSize = 1.5;
		const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load('https://threejs.org/manual/examples/resources/images/wall.jpg'); // example texture
		texture.colorSpace = THREE.SRGBColorSpace;

		const boxMaterial = new THREE.MeshPhongMaterial({ map: texture });

		const cube = new THREE.Mesh(boxGeometry, boxMaterial);
		cube.position.x = 3;
		cube.position.y = 10;
		scene.add(cube);
	}

	{
		const loader = new GLTFLoader();
		loader.load('objs/diningtable.glb', (gltf) => {
			const model = gltf.scene;
			model.scale.set(5.5, 5.25, 5.25);
			model.position.set(5, 0, -12);
			scene.add(model);

			// Add row of cubes *after* the dining table loads
			const boxSize = 0.5;
			const spacing = 0.6; // distance between cubes
			const startX = 5 - (spacing * 10); // center the row around x=5

			for (let i = 0; i < 20; i++) {
				const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
				const material = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
				const cube = new THREE.Mesh(geometry, material);

				// Position each cube in a row along the X axis
				cube.position.set(startX + i * spacing, 6, -12); // Y=6 puts it *above* the dining table
				scene.add(cube);
			}
		});
	}



	// {

	// 	const cubeSize = 4;
	// 	const cubeGeo = new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize );
	// 	const cubeMat = new THREE.MeshPhongMaterial( { color: '#8AC' } );
	// 	const mesh = new THREE.Mesh( cubeGeo, cubeMat );
	// 	mesh.position.set( cubeSize + 1, cubeSize / 2, 0 );
	// 	scene.add( mesh );

	// }
	{
		const pointLightColor = 0xFFFFFF;
		const pointLightIntensity = 500;
		const pointLight = new THREE.PointLight(pointLightColor, pointLightIntensity);
		pointLight.position.set(0, 10, 3);
		scene.add(pointLight);

		// Optional: helper to visualize the point light position
		const pointLightHelper = new THREE.PointLightHelper(pointLight);
		scene.add(pointLightHelper);

		// GUI controls
		const pointLightFolder = gui.addFolder('Point Light');
		pointLightFolder.addColor(new ColorGUIHelper(pointLight, 'color'), 'value').name('color');
		pointLightFolder.add(pointLight.position, 'x', -20, 20);
		pointLightFolder.open();
	}




	function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

	function render() {

		if ( resizeRendererToDisplaySize( renderer ) ) {

			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}

		if (cylinder) {
			cylinder.rotation.x += 0.1; // animate cylinder
		}

		renderer.render( scene, camera );

		requestAnimationFrame( render );

	}

	requestAnimationFrame( render );

}

main();