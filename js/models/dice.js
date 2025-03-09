import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function createDice(scene, physicsWorld) {
    // Create two dice
    const die1 = createDie(scene, physicsWorld, [-1, 5, 0]);
    const die2 = createDie(scene, physicsWorld, [1, 5, 0]);
    
    return [die1, die2];
}

function createDie(scene, physicsWorld, position) {
    const die = {
        mesh: null,
        body: null
    };
    
    // Create die mesh
    die.mesh = createDieMesh();
    die.mesh.position.set(...position);
    scene.add(die.mesh);
    
    // Create die physics body
    die.body = createDiePhysicsBody(position);
    physicsWorld.addBody(die.body);
    
    return die;
}

function createDieMesh() {
    // Die dimensions
    const size = 1;
    
    // Create die geometry
    const geometry = new THREE.BoxGeometry(size, size, size, 2, 2, 2);
    
    // Create materials for each face
    const materials = createDieMaterials();
    
    // Create mesh with materials
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add beveled edges
    addBeveledEdges(mesh);
    
    return mesh;
}

function createDieMaterials() {
    // Create textures for each face
    const loader = new THREE.TextureLoader();
    const materials = [];
    
    // Instead of loading external textures, we'll create them programmatically
    for (let i = 1; i <= 6; i++) {
        const texture = createDieTexture(i);
        
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 30,
            specular: 0x333333
        });
        
        materials.push(material);
    }
    
    // Order: right, left, top, bottom, front, back
    // Reorder to match standard dice configuration
    return [
        materials[3], // right: 4
        materials[2], // left: 3
        materials[0], // top: 1
        materials[5], // bottom: 6
        materials[1], // front: 2
        materials[4]  // back: 5
    ];
}

function createDieTexture(value) {
    // Create canvas for texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // Fill background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pips
    context.fillStyle = '#000000';
    
    const padding = 20;
    const pipSize = 16;
    
    // Pip positions based on die value
    const positions = getDiePipPositions(value, canvas.width, canvas.height, padding, pipSize);
    
    // Draw each pip
    positions.forEach(pos => {
        context.beginPath();
        context.arc(pos.x, pos.y, pipSize, 0, Math.PI * 2);
        context.fill();
    });
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
}

function getDiePipPositions(value, width, height, padding, pipSize) {
    const positions = [];
    const center = { x: width / 2, y: height / 2 };
    const offset = width / 3;
    
    // Define positions for each pip based on die value
    switch (value) {
        case 1:
            positions.push(center);
            break;
        case 2:
            positions.push(
                { x: center.x - offset, y: center.y - offset },
                { x: center.x + offset, y: center.y + offset }
            );
            break;
        case 3:
            positions.push(
                { x: center.x - offset, y: center.y - offset },
                center,
                { x: center.x + offset, y: center.y + offset }
            );
            break;
        case 4:
            positions.push(
                { x: center.x - offset, y: center.y - offset },
                { x: center.x + offset, y: center.y - offset },
                { x: center.x - offset, y: center.y + offset },
                { x: center.x + offset, y: center.y + offset }
            );
            break;
        case 5:
            positions.push(
                { x: center.x - offset, y: center.y - offset },
                { x: center.x + offset, y: center.y - offset },
                center,
                { x: center.x - offset, y: center.y + offset },
                { x: center.x + offset, y: center.y + offset }
            );
            break;
        case 6:
            positions.push(
                { x: center.x - offset, y: center.y - offset },
                { x: center.x + offset, y: center.y - offset },
                { x: center.x - offset, y: center.y },
                { x: center.x + offset, y: center.y },
                { x: center.x - offset, y: center.y + offset },
                { x: center.x + offset, y: center.y + offset }
            );
            break;
    }
    
    return positions;
}

function addBeveledEdges(mesh) {
    // Create a slightly larger cube for the edges
    const edgeGeometry = new THREE.BoxGeometry(1.05, 1.05, 1.05);
    const edgeMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        shininess: 0,
        transparent: true,
        opacity: 0.5
    });
    
    // Create edge mesh
    const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
    
    // Add edge mesh to die mesh
    mesh.add(edgeMesh);
}

function createDiePhysicsBody(position) {
    // Create physics body
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const material = new CANNON.Material('diceMaterial');
    
    const body = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: material,
        sleepTimeLimit: 1.0, // Time before the body goes to sleep (stops moving)
        sleepSpeedLimit: 0.1, // Speed limit below which the body is considered sleeping
        linearDamping: 0.4, // Air resistance for linear movement
        angularDamping: 0.4 // Air resistance for rotation
    });
    
    body.position.set(...position);
    
    return body;
} 