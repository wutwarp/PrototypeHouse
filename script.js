// --- 1. Import ไลบรารีที่จำเป็นจาก URL เต็ม (CDN) ---
// นี่คือส่วนที่แก้ไขและสำคัญที่สุด
// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
// import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// ตรวจสอบว่า THREE และ OrbitControls โหลดมาหรือยัง
if (typeof THREE === 'undefined') {
    alert("ไม่สามารถโหลดไลบรารี Three.js ได้ กรุณาตรวจสอบ <script> ใน HTML");
    throw new Error("Three.js not loaded");
}
if (typeof THREE.OrbitControls === 'undefined') {
    alert("ไม่สามารถโหลด OrbitControls ได้ กรุณาตรวจสอบ <script> ใน HTML");
    throw new Error("OrbitControls not loaded");
}

// --- 2. ตัวแปรหลัก ---
let scene, camera, renderer, controls;
const roomSize = { width: 500, depth: 400, height: 250 };


// --- 3. ฟังก์ชันเริ่มต้น (Init) ---
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, roomSize.height * 1.5, roomSize.depth * 1.5);

    // Renderer
    const canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 300, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // สร้างห้อง
    createRoom();

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, roomSize.height / 2, 0);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.1;

    // จัดการขนาดหน้าจอ
    window.addEventListener('resize', onWindowResize);

    // เริ่ม Animation Loop
    animate();
}

// --- ฟังก์ชันสร้างห้อง ---
function createRoom() {
    const floorGeometry = new THREE.BoxGeometry(roomSize.width, 5, roomSize.depth);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xCFB997 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = -2.5;
    scene.add(floor);

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

// --- 4. เริ่มต้นโปรแกรม ---
init();