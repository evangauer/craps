import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

// Import our custom modules
import { createTable } from './models/table.js';
import { createDice } from './models/dice.js';
import { createChips } from './models/chips.js';
import { BettingManager } from './models/bettingManager.js';
import { GameState } from './models/gameState.js';

// Game variables
let camera, scene, renderer, controls;
let physicsWorld;
let table, dice, chips;
let gameState, bettingManager;
let raycaster, mouse;
let selectedChipValue = null;
let tooltip;

// DOM elements
const rollButton = document.getElementById('rollButton');
const balanceDisplay = document.getElementById('balance');
const pointDisplay = document.getElementById('point');
const chipElements = document.querySelectorAll('.chip');

// Initialize the game
init();
animate();

function init() {
    // Create loading screen
    createLoadingScreen();
    
    // Initialize Three.js scene
    initScene();
    
    // Initialize physics world
    initPhysics();
    
    // Create game objects
    createGameObjects();
    
    // Initialize game state and betting manager
    gameState = new GameState(updateUI);
    bettingManager = new BettingManager(scene, gameState, updateUI);
    
    // Set up event listeners
    setupEventListeners();
    
    // Hide loading screen when everything is loaded
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
    }, 2000);
}

function createLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    
    const loadingText = document.createElement('div');
    loadingText.id = 'loading-text';
    loadingText.textContent = 'Loading 3D Craps Game...';
    
    const loadingBarContainer = document.createElement('div');
    loadingBarContainer.id = 'loading-bar-container';
    
    const loadingBar = document.createElement('div');
    loadingBar.id = 'loading-bar';
    
    loadingBarContainer.appendChild(loadingBar);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(loadingBarContainer);
    document.body.appendChild(loadingScreen);
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        loadingBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 100);
}

function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2E8B57); // Match table felt color
    
    // Create camera with orthographic projection for 2D-like view
    const aspectRatio = window.innerWidth / window.innerHeight;
    const viewSize = 20;
    camera = new THREE.OrthographicCamera(
        -viewSize * aspectRatio, viewSize * aspectRatio,
        viewSize, -viewSize,
        1, 1000
    );
    camera.position.set(0, 50, 0); // Position directly above
    camera.lookAt(0, 0, 0);
    
    // Create renderer with basic settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Add simple ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    // Add orbit controls with restricted movement
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // Disable rotation
    controls.enablePan = true; // Allow panning
    controls.enableZoom = true; // Allow zooming
    controls.minZoom = 0.5;
    controls.maxZoom = 2;
    controls.update();
    
    // Initialize raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create tooltip
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createRoom() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(60, 60);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x331111,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Walls with darker casino color
    const wallHeight = 20;
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x220000,
        roughness: 0.7,
        metalness: 0.3
    });
    
    // Create walls
    const walls = [
        { size: [0.5, wallHeight, 60], position: [-30, wallHeight/2 - 0.5, 0] }, // Left
        { size: [0.5, wallHeight, 60], position: [30, wallHeight/2 - 0.5, 0] },  // Right
        { size: [60, wallHeight, 0.5], position: [0, wallHeight/2 - 0.5, -30] }  // Back
    ];
    
    walls.forEach(wall => {
        const geometry = new THREE.BoxGeometry(...wall.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.position);
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
    
    // Add blocky people around the table
    createBlockyPeople();
    
    // Add smoke particles
    createSmokeEffects();
}

function createBlockyPeople() {
    const peoplePositions = [
        { pos: [-5, 0, 5], rot: Math.PI / 4 },
        { pos: [5, 0, 5], rot: -Math.PI / 4 },
        { pos: [0, 0, -5], rot: Math.PI },
        { pos: [-8, 0, -2], rot: Math.PI / 2 }
    ];
    
    peoplePositions.forEach(person => {
        // Create blocky person
        const body = new THREE.Group();
        
        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.5, 0.5),
            new THREE.MeshPhongMaterial({ color: Math.random() * 0xFFFFFF })
        );
        torso.position.y = 1.25;
        body.add(torso);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.4),
            new THREE.MeshPhongMaterial({ color: 0xFFD700 })
        );
        head.position.y = 2.2;
        body.add(head);
        
        // Position the person
        body.position.set(...person.pos);
        body.rotation.y = person.rot;
        scene.add(body);
    });
}

function createSmokeEffects() {
    const smokeParticles = new THREE.Group();
    scene.add(smokeParticles);
    
    // Create smoke texture
    const smokeTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=');
    
    // Create particles
    const particleCount = 50;
    const particles = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        particles[i * 3] = Math.random() * 20 - 10;     // x
        particles[i * 3 + 1] = Math.random() * 10 + 5;  // y
        particles[i * 3 + 2] = Math.random() * 20 - 10; // z
        sizes[i] = Math.random() * 2 + 1;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 0.5,
        map: smokeTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.2,
        color: 0xCCCCCC
    });
    
    const particleSystem = new THREE.Points(geometry, material);
    smokeParticles.add(particleSystem);
    
    // Animate smoke
    function animateSmoke() {
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] += 0.02; // Move up
            
            // Reset particle if it goes too high
            if (positions[i * 3 + 1] > 15) {
                positions[i * 3 + 1] = 5;
                positions[i * 3] = Math.random() * 20 - 10;
                positions[i * 3 + 2] = Math.random() * 20 - 10;
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateSmoke);
    }
    
    animateSmoke();
}

function createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main spotlight over table
    const mainSpotlight = new THREE.SpotLight(0xffffff, 1.5);
    mainSpotlight.position.set(0, 25, 0);
    mainSpotlight.angle = Math.PI / 6;
    mainSpotlight.penumbra = 0.2;
    mainSpotlight.decay = 1.5;
    mainSpotlight.distance = 50;
    mainSpotlight.castShadow = true;
    mainSpotlight.shadow.mapSize.width = 2048;
    mainSpotlight.shadow.mapSize.height = 2048;
    mainSpotlight.shadow.bias = -0.0001;
    scene.add(mainSpotlight);
    
    // Add spotlight target
    const spotlightTarget = new THREE.Object3D();
    spotlightTarget.position.set(0, 0, 0);
    scene.add(spotlightTarget);
    mainSpotlight.target = spotlightTarget;
    
    // Additional accent lights
    const accentLights = [
        { position: [15, 15, 15], color: 0xffd700, intensity: 0.5 },
        { position: [-15, 15, 15], color: 0xffd700, intensity: 0.5 },
        { position: [15, 15, -15], color: 0xffd700, intensity: 0.5 },
        { position: [-15, 15, -15], color: 0xffd700, intensity: 0.5 }
    ];
    
    accentLights.forEach(light => {
        const pointLight = new THREE.PointLight(light.color, light.intensity);
        pointLight.position.set(...light.position);
        scene.add(pointLight);
    });
}

function initPhysics() {
    // Create physics world
    physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0) // Earth gravity
    });
    
    // Set solver iterations for better stability
    physicsWorld.solver.iterations = 10;
    
    // Add contact material for dice-table interaction
    const tableMaterial = new CANNON.Material('tableMaterial');
    const diceMaterial = new CANNON.Material('diceMaterial');
    
    const contactMaterial = new CANNON.ContactMaterial(
        tableMaterial,
        diceMaterial,
        {
            friction: 0.3,
            restitution: 0.6 // Bounciness
        }
    );
    
    physicsWorld.addContactMaterial(contactMaterial);
}

function createGameObjects() {
    // Create table
    table = createTable(scene, physicsWorld);
    
    // Create dice
    dice = createDice(scene, physicsWorld);
    
    // Create chips
    chips = createChips(scene);
}

function setupEventListeners() {
    // Roll button event listener
    rollButton.addEventListener('click', () => {
        if (!gameState.isRolling) {
            rollDice();
        }
    });
    
    // Chip selection event listeners
    chipElements.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove selected class from all chips
            chipElements.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked chip
            chip.classList.add('selected');
            
            // Set selected chip value
            selectedChipValue = parseInt(chip.dataset.value);
        });
    });
    
    // Canvas click event for placing bets
    renderer.domElement.addEventListener('click', onCanvasClick);
    
    // Mouse move event for hover effects
    renderer.domElement.addEventListener('mousemove', onMouseMove);
}

function onWindowResize() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const viewSize = 20;
    
    camera.left = -viewSize * aspectRatio;
    camera.right = viewSize * aspectRatio;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Raycast to find intersected objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Check if we're hovering over a betting area
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // If the object has a userData.type property of 'bettingArea'
        if (object.userData && object.userData.type === 'bettingArea') {
            // Show tooltip
            tooltip.textContent = object.userData.name;
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            tooltip.classList.add('visible');
            
            // Highlight the betting area
            object.material.emissive.set(0x333333);
            return;
        }
    }
    
    // Hide tooltip and remove highlights if not hovering over a betting area
    tooltip.classList.remove('visible');
    scene.traverse(object => {
        if (object.userData && object.userData.type === 'bettingArea' && object.material) {
            object.material.emissive.set(0x000000);
        }
    });
}

function onCanvasClick(event) {
    // Only process clicks if a chip is selected
    if (selectedChipValue === null) return;
    
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Raycast to find intersected objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Check if we clicked on a betting area
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // If the object has a userData.type property of 'bettingArea'
        if (object.userData && object.userData.type === 'bettingArea') {
            // Check if this bet is allowed in the current game state
            if (isValidBet(object.userData.id)) {
                // Place bet
                bettingManager.placeBet(object.userData.id, selectedChipValue, intersects[0].point);
            } else {
                // Show message that this bet is not allowed
                showBettingMessage(`${object.userData.name} bet not allowed at this time`);
            }
        }
    }
}

function rollDice() {
    // Set rolling state
    gameState.isRolling = true;
    rollButton.disabled = true;
    
    // Apply random forces to dice
    dice.forEach(die => {
        // Reset position and rotation
        die.body.position.set(
            Math.random() * 2 - 1, // Random X position
            10 + Math.random() * 5, // Random height
            Math.random() * 2 - 1  // Random Z position
        );
        
        // Random rotation
        die.body.quaternion.setFromEuler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Apply impulse
        die.body.angularVelocity.set(
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
        );
        
        die.body.velocity.set(
            Math.random() * 5 - 2.5,
            Math.random() * 5 + 5,
            Math.random() * 5 - 2.5
        );
    });
    
    // Check when dice have settled
    checkDiceSettled();
}

function checkDiceSettled() {
    // Wait a bit before checking if dice have settled
    setTimeout(() => {
        let settled = true;
        
        // Check if all dice have settled (very low velocity)
        dice.forEach(die => {
            const velocity = die.body.velocity.length();
            const angularVelocity = die.body.angularVelocity.length();
            
            if (velocity > 0.1 || angularVelocity > 0.1) {
                settled = false;
            }
        });
        
        if (settled) {
            // Get dice values
            const values = dice.map(die => getDieValue(die));
            
            // Resolve bets
            gameState.resolveBets(values[0], values[1]);
            
            // Clear one-roll bets visually
            bettingManager.clearOneRollBets();
            
            // If point was made or 7 was rolled, clear appropriate bets
            if ((gameState.point !== null && values[0] + values[1] === gameState.point) || 
                values[0] + values[1] === 7) {
                bettingManager.clearAllBetsOnPointOrSeven();
            }
            
            // Update table state (highlight current point, etc.)
            bettingManager.updateTableState();
            
            // Enable roll button
            rollButton.disabled = false;
            gameState.isRolling = false;
        } else {
            // Check again in a bit
            checkDiceSettled();
        }
    }, 1000);
}

function getDieValue(die) {
    // Get the die's rotation
    const rotation = new THREE.Euler().setFromQuaternion(die.mesh.quaternion);
    
    // Determine which face is pointing up
    // This is a simplified version - in a real implementation,
    // you would need more precise calculations
    
    // Convert rotation to direction vector
    const direction = new THREE.Vector3(0, 1, 0);
    direction.applyEuler(rotation);
    
    // Find the face that's most aligned with the up direction
    let maxDot = -Infinity;
    let faceValue = 1;
    
    // Check each face direction
    const faceDirections = [
        { dir: new THREE.Vector3(0, 1, 0), value: 1 },  // Top
        { dir: new THREE.Vector3(0, -1, 0), value: 6 }, // Bottom
        { dir: new THREE.Vector3(1, 0, 0), value: 3 },  // Right
        { dir: new THREE.Vector3(-1, 0, 0), value: 4 }, // Left
        { dir: new THREE.Vector3(0, 0, 1), value: 2 },  // Front
        { dir: new THREE.Vector3(0, 0, -1), value: 5 }  // Back
    ];
    
    faceDirections.forEach(face => {
        const rotatedDir = face.dir.clone().applyQuaternion(die.mesh.quaternion);
        const dot = rotatedDir.dot(new THREE.Vector3(0, 1, 0));
        
        if (dot > maxDot) {
            maxDot = dot;
            faceValue = face.value;
        }
    });
    
    return faceValue;
}

function updateUI() {
    // Update balance display
    balanceDisplay.textContent = `Balance: $${gameState.balance}`;
    
    // Update point display
    if (gameState.point === null) {
        pointDisplay.textContent = 'Point: none';
    } else {
        pointDisplay.textContent = `Point: ${gameState.point}`;
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update physics
    physicsWorld.fixedStep();
    
    // Update dice positions based on physics
    dice.forEach(die => {
        die.mesh.position.copy(die.body.position);
        die.mesh.quaternion.copy(die.body.quaternion);
    });
    
    // Update controls
    controls.update();
    
    // Ensure camera is looking at the table
    camera.lookAt(0, 0, 0);
    
    // Render scene
    renderer.render(scene, camera);
}

// Function to check if a bet is valid in the current game state
function isValidBet(betId) {
    // Come bets are only allowed after a point is established
    if (betId === 'come' && gameState.point === null) {
        return false;
    }
    
    // Don't Pass bets are not allowed after a point is established
    if (betId === 'dontPass' && gameState.point !== null) {
        return false;
    }
    
    // All other bets are allowed
    return true;
}

// Function to show a message about betting
function showBettingMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'betting-message';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    // Remove message after a delay
    setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 500);
    }, 2000);
}

// Update the roll button style
document.getElementById('rollButton').style.cssText = `
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
`; 