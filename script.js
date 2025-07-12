// ตรวจสอบว่าไลบรารีโหลดมาครบหรือไม่
if (typeof THREE === 'undefined') { throw new Error("Three.js not loaded"); }
if (typeof THREE.OrbitControls === 'undefined') { throw new Error("OrbitControls not loaded"); }
if (typeof THREE.GLTFLoader === 'undefined') { throw new Error("GLTFLoader not loaded"); }

// --- ตัวแปรหลัก ---
let scene, camera, renderer, controls, loader;
const roomSize = { width: 500, depth: 400, height: 250 };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentlyPlacingObject = null;
let intersectableObjects = [];

// --- ฟังก์ชันเริ่มต้น (Init) ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, roomSize.height * 1.8, roomSize.depth * 1.5);

    const canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // *** NEW LIGHTING SETUP - PART 1: ปรับปรุงการแสดงผลของ Renderer ***
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;


    // *** NEW LIGHTING SETUP - PART 2: ตั้งค่าแสงใหม่ทั้งหมด ***
    // แสงจากฟ้าและพื้น (Hemisphere) - ทำให้เงาสว่างขึ้น
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemisphereLight);

    // แสงบรรยากาศรอบทิศทาง (Ambient) - เพิ่มความสว่างพื้นฐาน
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // แสงหลักที่สร้างเงา (Directional) - ลดความแรงลงเล็กน้อย
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(100, 300, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    loader = new THREE.GLTFLoader();
    
    createRoom();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.1;

    setupEventListeners();

    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('click', onClick, false);
    window.addEventListener('keydown', onKeyDown, false);

    window.addEventListener('resize', onWindowResize);
    animate();
}

// ... ส่วนที่เหลือของโค้ดเหมือนเดิมทั้งหมด ...

// --- ฟังก์ชันสร้างห้อง ---
function createRoom() {
    const floorGeometry = new THREE.BoxGeometry(roomSize.width, 5, roomSize.depth);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xCFB997 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = -2.5;
    floor.name = 'floor';
    scene.add(floor);
    intersectableObjects.push(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const wallHeight = roomSize.height;
    const wallThickness = 10;
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize.width + wallThickness, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight / 2, -roomSize.depth / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize.depth + wallThickness), wallMaterial);
    leftWall.position.set(-roomSize.width / 2, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
}

// --- ฟังก์ชันสำหรับโหลดโมเดล 3D ---
function loadModel(url) {
    if (currentlyPlacingObject) return;
    loader.load(url, (gltf) => {
        const model = gltf.scene;
        model.name = "placeable_object";
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.userData.parentModel = model;
            }
        });
        model.scale.set(100, 100, 100);
        currentlyPlacingObject = model;
        scene.add(currentlyPlacingObject);
        controls.enabled = false;
    });
}

// --- ฟังก์ชันสำหรับตั้งค่า Event Listeners ---
function setupEventListeners() {
    document.querySelectorAll('.furniture-item').forEach(button => {
        button.addEventListener('click', () => {
            loadModel(button.dataset.modelUrl);
        });
    });
}

// --- ฟังก์ชันเมื่อเมาส์เคลื่อนที่ ---
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    if (!currentlyPlacingObject) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(intersectableObjects);
    if (intersects.length > 0) {
        const floorIntersection = intersects.find(intersect => intersect.object.name === 'floor');
        if (floorIntersection) {
            currentlyPlacingObject.position.copy(floorIntersection.point);
        }
    }
}

// --- ฟังก์ชันเมื่อมีการคลิกเมาส์ ---
function onClick(event) {
    if (currentlyPlacingObject) {
        intersectableObjects.push(currentlyPlacingObject);
        currentlyPlacingObject = null;
        controls.enabled = true;
        return;
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    for (const intersect of intersects) {
        if (intersect.object.userData.parentModel) {
            const objectToMove = intersect.object.userData.parentModel;
            intersectableObjects = intersectableObjects.filter(o => o !== objectToMove);
            currentlyPlacingObject = objectToMove;
            controls.enabled = false;
            return;
        }
    }
}

// --- ฟังก์ชันเมื่อมีการกดคีย์บอร์ด ---
function onKeyDown(event) {
    if (!currentlyPlacingObject) return;
    switch (event.key) {
        case 'r':
        case 'R':
            currentlyPlacingObject.rotation.y += Math.PI / 2;
            break;
        case 'Delete':
        case 'Backspace':
            deleteObject(currentlyPlacingObject);
            break;
    }
}

// --- ฟังก์ชันสำหรับลบวัตถุและคืนค่าหน่วยความจำ ---
function deleteObject(object) {
    scene.remove(object);
    object.traverse((child) => {
        if (child.isMesh) {
            child.geometry.dispose();
            child.material.dispose();
        }
    });
    currentlyPlacingObject = null;
    controls.enabled = true;
}

// --- ฟังก์ชันที่ทำงานตลอดเวลา ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- ฟังก์ชันสำหรับปรับขนาดเมื่อหน้าจอเปลี่ยน ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- เริ่มต้นโปรแกรม ---
init();