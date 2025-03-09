import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function createTable(scene, physicsWorld) {
    const table = {
        mesh: null,
        body: null,
        bettingAreas: {},
        pointBoxes: {}
    };
    
    // Create table surface - standard craps table is 12-14 feet long by 3.5-4 feet wide
    // Using a 2:1 ratio for length:width (12 feet x 6 feet in our 3D units)
    const tableLength = 24; // 12 feet in our scale
    const tableWidth = 12;  // 6 feet in our scale
    const tableHeight = 1;
    
    const tableGeometry = new THREE.BoxGeometry(tableLength, tableHeight, tableWidth);
    
    // Create felt texture
    const feltTexture = createFeltTexture();
    
    const tableMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2e7d32, // Green felt
        map: feltTexture,
        shininess: 5, // Lower shininess for felt
        bumpMap: feltTexture,
        bumpScale: 0.01 // Subtle texture
    });
    
    table.mesh = new THREE.Mesh(tableGeometry, tableMaterial);
    table.mesh.position.set(0, -0.5, 0);
    table.mesh.receiveShadow = true;
    scene.add(table.mesh);
    
    // Create table physics body
    const tableShape = new CANNON.Box(new CANNON.Vec3(tableLength/2, tableHeight/2, tableWidth/2));
    const tableMat = new CANNON.Material('tableMaterial');
    table.body = new CANNON.Body({
        mass: 0, // Static body
        shape: tableShape,
        material: tableMat
    });
    table.body.position.set(0, -0.5, 0);
    physicsWorld.addBody(table.body);
    
    // Create table walls and rail
    createTableRail(table, scene, physicsWorld, tableLength, tableWidth);
    
    // Create table layout
    createTableLayout(table, scene, tableLength, tableWidth);
    
    return table;
}

function createFeltTexture() {
    // Create canvas for felt texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Fill with base color
    context.fillStyle = '#2e7d32';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle noise for felt texture
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Add random noise to each pixel
        const noise = Math.random() * 10 - 5;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    
    context.putImageData(imageData, 0, 0);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    
    return texture;
}

function createTableRail(table, scene, physicsWorld, tableLength, tableWidth) {
    // Rail dimensions
    const railHeight = 0.8;
    const railWidth = 0.8;
    const railPadding = 0.4; // Padding between table edge and rail
    
    // Rail material - wood with padding
    const railMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513, // Brown wood
        shininess: 30
    });
    
    const railPaddingMaterial = new THREE.MeshPhongMaterial({
        color: 0x006400, // Dark green padding
        shininess: 10
    });
    
    // Create rails
    const railSegments = [
        // Left rail
        { 
            size: [railWidth, railHeight, tableWidth + railWidth * 2], 
            position: [-tableLength/2 - railWidth/2 + railPadding, railHeight/2, 0],
            rotation: [0, 0, 0]
        },
        // Right rail
        { 
            size: [railWidth, railHeight, tableWidth + railWidth * 2], 
            position: [tableLength/2 + railWidth/2 - railPadding, railHeight/2, 0],
            rotation: [0, 0, 0]
        },
        // Back rail
        { 
            size: [tableLength, railHeight, railWidth], 
            position: [0, railHeight/2, -tableWidth/2 - railWidth/2 + railPadding],
            rotation: [0, 0, 0]
        },
        // Front rail
        { 
            size: [tableLength, railHeight, railWidth], 
            position: [0, railHeight/2, tableWidth/2 + railWidth/2 - railPadding],
            rotation: [0, 0, 0]
        }
    ];
    
    railSegments.forEach(rail => {
        // Create rail mesh
        const geometry = new THREE.BoxGeometry(...rail.size);
        const mesh = new THREE.Mesh(geometry, railMaterial);
        mesh.position.set(...rail.position);
        if (rail.rotation) {
            mesh.rotation.set(...rail.rotation);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        
        // Create padding on top of rail
        const paddingGeometry = new THREE.BoxGeometry(rail.size[0], 0.2, rail.size[2]);
        const paddingMesh = new THREE.Mesh(paddingGeometry, railPaddingMaterial);
        paddingMesh.position.set(rail.position[0], rail.position[1] + rail.size[1]/2 + 0.1, rail.position[2]);
        if (rail.rotation) {
            paddingMesh.rotation.set(...rail.rotation);
        }
        paddingMesh.castShadow = true;
        paddingMesh.receiveShadow = true;
        scene.add(paddingMesh);
        
        // Create physics body for rail
        const shape = new CANNON.Box(new CANNON.Vec3(rail.size[0]/2, rail.size[1]/2, rail.size[2]/2));
        const body = new CANNON.Body({
            mass: 0, // Static body
            shape: shape,
            material: new CANNON.Material('railMaterial')
        });
        body.position.set(...rail.position);
        physicsWorld.addBody(body);
    });
    
    // Add dealer area cutout (the curved section)
    createDealerArea(scene, tableLength, tableWidth);
}

function createDealerArea(scene, tableLength, tableWidth) {
    // Create dealer area with improved curved section
    const dealerAreaRadius = tableWidth / 2;
    const dealerAreaDepth = tableWidth / 3;
    
    const dealerAreaShape = new THREE.Shape();
    dealerAreaShape.moveTo(-dealerAreaRadius, 0);
    dealerAreaShape.absarc(0, 0, dealerAreaRadius, Math.PI, 0, true);
    dealerAreaShape.lineTo(dealerAreaRadius, -dealerAreaDepth);
    dealerAreaShape.lineTo(-dealerAreaRadius, -dealerAreaDepth);
    dealerAreaShape.lineTo(-dealerAreaRadius, 0);
    
    const extrudeSettings = {
        steps: 2,
        depth: 0.8,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelOffset: 0,
        bevelSegments: 8
    };
    
    // Create padded rail material
    const railPadding = new THREE.MeshPhongMaterial({
        color: 0x006400,
        shininess: 10,
        specular: 0x333333
    });
    
    const dealerAreaGeometry = new THREE.ExtrudeGeometry(dealerAreaShape, extrudeSettings);
    const dealerAreaMesh = new THREE.Mesh(dealerAreaGeometry, railPadding);
    dealerAreaMesh.position.set(0, 0, tableWidth/2 + 0.8);
    dealerAreaMesh.rotation.set(Math.PI/2, 0, 0);
    dealerAreaMesh.castShadow = true;
    dealerAreaMesh.receiveShadow = true;
    scene.add(dealerAreaMesh);
}

function createTableLayout(table, scene, tableLength, tableWidth) {
    // Create the main layout texture
    const layoutTexture = createLayoutTexture(tableLength, tableWidth);
    
    // Apply texture to table
    const layoutGeometry = new THREE.PlaneGeometry(tableLength - 0.5, tableWidth - 0.5);
    const layoutMaterial = new THREE.MeshBasicMaterial({
        map: layoutTexture,
        transparent: true,
        opacity: 1
    });
    
    const layoutMesh = new THREE.Mesh(layoutGeometry, layoutMaterial);
    layoutMesh.position.set(0, 0.01, 0); // Slightly above table surface
    layoutMesh.rotation.x = -Math.PI / 2; // Rotate to lay flat
    scene.add(layoutMesh);
    
    // Create betting areas (invisible collision meshes for interaction)
    createBettingAreas(table, scene, tableLength, tableWidth);
}

function createLayoutTexture(tableLength, tableWidth) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size with very high resolution for sharp text
    const scale = 200; // Higher resolution for better text quality
    canvas.width = tableLength * scale;
    canvas.height = tableWidth * scale;
    
    // Set background color to match casino felt green
    context.fillStyle = '#66B366'; // Brighter green for better visibility
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up coordinate transformation - no vertical flip
    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(scale, scale);
    
    // Draw dealer area semicircle
    context.fillStyle = '#0D5D0D'; // Darker green for dealer area
    context.beginPath();
    context.arc(0, tableWidth/2, tableWidth/3, 0, Math.PI, false);
    context.fill();
    
    // Draw white border around entire table
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    context.strokeRect(-tableLength/2 + 1, -tableWidth/2 + 1, tableLength - 2, tableWidth - 2);
    
    // Draw layout elements in correct order
    drawPassLine(context, tableLength, tableWidth);
    drawDontPass(context, tableLength, tableWidth);
    drawField(context, tableLength, tableWidth);
    drawCome(context, tableLength, tableWidth);
    drawPointBoxes(context, tableLength, tableWidth);
    drawPropositionBets(context, tableLength, tableWidth);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function drawPointBoxes(context, tableLength, tableWidth) {
    const boxWidth = 3;
    const boxHeight = 3;
    const spacing = 0.5;
    const y = 0;
    
    // Draw boxes for 4, 5, 6, 8, 9, 10
    const points = [
        { value: 4, x: -7.5 },
        { value: 5, x: -4 },
        { value: 6, x: -0.5 },
        { value: 8, x: 3 },
        { value: 9, x: 6.5 },
        { value: 10, x: 10 }
    ];
    
    points.forEach(point => {
        // Draw box
        context.strokeStyle = 'white';
        context.lineWidth = 0.1;
        context.beginPath();
        context.rect(point.x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
        context.stroke();
        
        // Add number
        context.fillStyle = 'white';
        context.font = 'bold 2px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(point.value.toString(), point.x, y);
    });
}

function drawPassLine(context, tableLength, tableWidth) {
    // Draw Pass Line area
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    
    // Create pass line shape
    context.beginPath();
    context.rect(-tableLength/2 + 2, -tableWidth/2 + 2, tableLength/3, tableWidth/4);
    context.stroke();
    
    // Add "PASS LINE" text
    context.fillStyle = 'white';
    context.font = 'bold 1.5px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("PASS LINE", -tableLength/2 + 2 + tableLength/6, -tableWidth/2 + 2 + tableWidth/8);
}

function drawDontPass(context, tableLength, tableWidth) {
    // Draw Don't Pass area
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    
    // Create don't pass shape
    context.beginPath();
    context.rect(-tableLength/2 + 2 + tableLength/3 + 0.5, -tableWidth/2 + 2, tableLength/4, tableWidth/4);
    context.stroke();
    
    // Add "DON'T PASS" text
    context.fillStyle = 'white';
    context.font = 'bold 1.5px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("DON'T PASS", -tableLength/2 + 2 + tableLength/3 + 0.5 + tableLength/8, -tableWidth/2 + 2 + tableWidth/8);
}

function drawCome(context, tableLength, tableWidth) {
    // Draw Come area
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    
    // Create come shape
    context.beginPath();
    context.rect(0, -tableWidth/2 + 2, tableLength/4, tableWidth/4);
    context.stroke();
    
    // Add "COME" text in red
    context.fillStyle = '#FF0000';
    context.font = 'bold 1.8px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("COME", 0 + tableLength/8, -tableWidth/2 + 2 + tableWidth/8);
}

function drawField(context, tableLength, tableWidth) {
    // Draw Field area
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    
    // Create field shape
    context.beginPath();
    context.rect(tableLength/4 + 0.5, -tableWidth/2 + 2, tableLength/4, tableWidth/4);
    context.stroke();
    
    // Add "FIELD" text in yellow
    context.fillStyle = '#FFFF00';
    context.font = 'bold 1.8px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("FIELD", tableLength/4 + 0.5 + tableLength/8, -tableWidth/2 + 2 + tableWidth/8);
}

function drawPropositionBets(context, tableLength, tableWidth) {
    // Draw proposition bets area at the center top of the table
    const width = 10;
    const height = 5;
    const x = 0;
    const y = tableWidth/4;
    
    // Draw border
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    context.beginPath();
    context.rect(x - width/2, y - height/2, width, height);
    context.stroke();
    
    // Add "PROPOSITION BETS" text
    context.fillStyle = 'white';
    context.font = 'bold 1px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("PROPOSITION BETS", x, y - height/3);
    
    // Draw common proposition bets
    const bets = [
        { text: "7", x: x - 3, y: y },
        { text: "11", x: x, y: y },
        { text: "Any Craps", x: x + 3, y: y },
        { text: "Hard 6", x: x - 2, y: y + height/3 },
        { text: "Hard 8", x: x + 2, y: y + height/3 }
    ];
    
    bets.forEach(bet => {
        context.fillStyle = bet.text === "7" ? '#FF0000' : 'white';
        context.font = 'bold 0.8px Arial';
        context.fillText(bet.text, bet.x, bet.y);
    });
}

function createBettingAreas(table, scene, tableLength, tableWidth) {
    // Create invisible collision meshes for betting areas
    const bettingAreas = [
        {
            id: 'passLine',
            name: 'Pass Line',
            shape: createPassLineShape(tableLength, tableWidth),
            position: [0, 0.02, -1],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'dontPass',
            name: "Don't Pass Bar",
            shape: new THREE.PlaneGeometry(tableLength - 4, 1.5),
            position: [0, 0.02, -tableWidth/2 + 3 + 0.75],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'field',
            name: 'Field',
            shape: new THREE.PlaneGeometry(tableLength - 6, 3),
            position: [0, 0.02, -tableWidth/2 + 5 + 1.5],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'come',
            name: 'Come',
            shape: new THREE.PlaneGeometry(tableLength - 8, 3),
            position: [0, 0.02, -tableWidth/2 + 8.5 + 1.5],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'seven',
            name: 'Seven (4:1)',
            shape: new THREE.PlaneGeometry(1.5, 1),
            position: [0, 0.02, 0 - 0.75],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'hard4',
            name: 'Hard 4 (7:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [-2, 0.02, 0 - 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'hard6',
            name: 'Hard 6 (9:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [-1, 0.02, 0 - 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'hard8',
            name: 'Hard 8 (9:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [1, 0.02, 0 - 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'hard10',
            name: 'Hard 10 (7:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [2, 0.02, 0 - 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'anyCraps',
            name: 'Any Craps (7:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [-1.5, 0.02, 0 + 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'craps2',
            name: 'Craps 2 (30:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [-2.5, 0.02, 0 + 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'craps3',
            name: 'Craps 3 (15:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [-0.5, 0.02, 0 + 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'yo11',
            name: 'Yo (11) (15:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [0.5, 0.02, 0 + 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        },
        {
            id: 'craps12',
            name: 'Craps 12 (30:1)',
            shape: new THREE.PlaneGeometry(0.8, 0.8),
            position: [2.5, 0.02, 0 + 0.8],
            rotation: [-Math.PI / 2, 0, 0]
        }
    ];
    
    // Add point boxes
    const pointNumbers = [4, 5, 6, 8, 9, 10];
    const boxWidth = 2;
    const boxHeight = 2;
    const y = -tableWidth/2 + 12;
    const spacing = 0.5;
    const totalWidth = pointNumbers.length * (boxWidth + spacing) - spacing;
    const startX = -totalWidth / 2 + boxWidth / 2;
    
    pointNumbers.forEach((number, index) => {
        const x = startX + index * (boxWidth + spacing);
        
        bettingAreas.push({
            id: `point${number}`,
            name: `Place ${number}`,
            shape: new THREE.PlaneGeometry(boxWidth, boxHeight),
            position: [x, 0.02, y],
            rotation: [-Math.PI / 2, 0, 0]
        });
    });
    
    // Create meshes for betting areas
    bettingAreas.forEach(area => {
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.0, // Invisible but interactive
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(area.shape, material);
        mesh.position.set(...area.position);
        mesh.rotation.set(...area.rotation);
        mesh.userData = {
            type: 'bettingArea',
            id: area.id,
            name: area.name
        };
        scene.add(mesh);
        
        // Store reference to betting area
        table.bettingAreas[area.id] = mesh;
    });
}

function createPassLineShape(tableLength, tableWidth) {
    // Create custom shape for pass line
    const shape = new THREE.Shape();
    
    const width = tableLength - 2;
    const height = tableWidth - 2;
    
    // Bottom edge
    shape.moveTo(-width/2, -height/2);
    shape.lineTo(width/2, -height/2);
    
    // Right edge
    shape.lineTo(width/2, height/2 - 3);
    
    // Top edge (with cutout for dealer area)
    shape.lineTo(width/4, height/2 - 3);
    shape.arc(0, height/2 - 3, width/4, 0, Math.PI, true);
    shape.lineTo(-width/2, height/2 - 3);
    
    // Left edge
    shape.lineTo(-width/2, -height/2);
    
    // Create shape geometry
    return new THREE.ShapeGeometry(shape);
} 