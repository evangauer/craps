import * as THREE from 'three';

export function createChips(scene) {
    // Create chip models for each denomination
    const chipModels = {
        1: createChipModel(0x87CEEB, 0x4682B4, '$1'),  // Light blue
        5: createChipModel(0x9932CC, 0x4B0082, '$5'),  // Purple
        10: createChipModel(0x333333, 0xC0C0C0, '$10') // Black
    };
    
    return chipModels;
}

function createChipModel(mainColor, edgeColor, label) {
    // Create chip geometry
    const chipGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    
    // Create materials
    const materials = createChipMaterials(mainColor, edgeColor, label);
    
    // Create chip mesh
    const chipMesh = new THREE.Mesh(chipGeometry, materials);
    chipMesh.castShadow = true;
    chipMesh.receiveShadow = true;
    
    return chipMesh;
}

function createChipMaterials(mainColor, edgeColor, label) {
    // Create materials for different parts of the chip
    const mainMaterial = new THREE.MeshPhongMaterial({
        color: mainColor,
        shininess: 100,
        specular: 0x333333
    });
    
    const edgeMaterial = new THREE.MeshPhongMaterial({
        color: edgeColor,
        shininess: 100,
        specular: 0x333333
    });
    
    // Create texture for the top and bottom faces with label
    const topTexture = createChipTexture(mainColor, edgeColor, label);
    const topMaterial = new THREE.MeshPhongMaterial({
        map: topTexture,
        shininess: 100,
        specular: 0x333333
    });
    
    // Create an array of materials for the cylinder
    // Order: side, top, bottom
    const materials = [
        edgeMaterial, // side
        topMaterial,  // top
        topMaterial   // bottom
    ];
    
    return materials;
}

function createChipTexture(mainColor, edgeColor, label) {
    // Create canvas for texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // Convert colors to CSS format
    const mainColorCSS = `#${mainColor.toString(16).padStart(6, '0')}`;
    const edgeColorCSS = `#${edgeColor.toString(16).padStart(6, '0')}`;
    
    // Draw chip background
    context.fillStyle = mainColorCSS;
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    context.fill();
    
    // Draw segmented edge
    const segments = 12;
    const segmentAngle = (Math.PI * 2) / segments;
    const outerRadius = canvas.width / 2;
    const innerRadius = canvas.width / 2 - 10;
    
    for (let i = 0; i < segments; i++) {
        if (i % 2 === 0) {
            context.fillStyle = edgeColorCSS;
        } else {
            context.fillStyle = '#ffffff';
        }
        
        const startAngle = i * segmentAngle;
        const endAngle = (i + 1) * segmentAngle;
        
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, outerRadius, startAngle, endAngle);
        context.arc(canvas.width / 2, canvas.height / 2, innerRadius, endAngle, startAngle, true);
        context.fill();
    }
    
    // Draw center circle
    context.fillStyle = mainColorCSS;
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, innerRadius, 0, Math.PI * 2);
    context.fill();
    
    // Draw label
    context.fillStyle = getContrastColor(mainColor);
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
}

function getContrastColor(color) {
    // Extract RGB components
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    // Calculate luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Return black or white based on luminance
    return luminance > 128 ? '#000000' : '#ffffff';
}

export function createChipStack(scene, chipModel, position, count) {
    const chips = [];
    
    // Create stack of chips
    for (let i = 0; i < count; i++) {
        const chip = chipModel.clone();
        chip.position.set(position.x, position.y + i * 0.1, position.z);
        scene.add(chip);
        chips.push(chip);
    }
    
    return chips;
} 