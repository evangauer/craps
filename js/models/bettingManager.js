import * as THREE from 'three';

export class BettingManager {
    constructor(scene, gameState, updateUICallback) {
        this.scene = scene;
        this.gameState = gameState;
        this.updateUI = updateUICallback;
        this.chipObjects = {
            // Basic bets
            passLine: [],
            dontPass: [],
            field: [],
            come: [],
            
            // Proposition bets
            seven: [],
            hard4: [],
            hard6: [],
            hard8: [],
            hard10: [],
            anyCraps: [],
            craps2: [],
            craps3: [],
            yo11: [],
            craps12: [],
            
            // Place bets
            point4: [],
            point5: [],
            point6: [],
            point8: [],
            point9: [],
            point10: []
        };
        
        // Chip materials
        this.chipMaterials = {
            1: this.createChipMaterial(0x87CEEB, 0x4682B4), // Light blue
            5: this.createChipMaterial(0x9932CC, 0x4B0082), // Purple
            10: this.createChipMaterial(0x333333, 0xC0C0C0)  // Black
        };
    }
    
    createChipMaterial(mainColor, edgeColor) {
        // Create a material for the chip
        const material = new THREE.MeshPhongMaterial({
            color: mainColor,
            shininess: 100,
            specular: 0x333333
        });
        
        return material;
    }
    
    placeBet(areaId, amount, position) {
        // Try to place bet in game state
        if (!this.gameState.placeBet(areaId, amount)) {
            return false;
        }
        
        // Create 3D chip object
        const chipGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
        const chipMaterial = this.chipMaterials[amount];
        const chip = new THREE.Mesh(chipGeometry, chipMaterial);
        
        // Position the chip
        chip.position.copy(position);
        chip.position.y += 0.05; // Lift slightly above the table
        
        // Add chip to scene
        this.scene.add(chip);
        
        // Store reference to chip object
        if (areaId === 'come') {
            // For come bets, we need to track the chip with the bet
            const lastComeBet = this.gameState.bets.come[this.gameState.bets.come.length - 1];
            lastComeBet.chipObject = chip;
        } else {
            this.chipObjects[areaId].push(chip);
        }
        
        return true;
    }
    
    clearBets(areas = []) {
        areas.forEach(area => {
            // Remove chips from scene
            this.chipObjects[area].forEach(chip => {
                this.scene.remove(chip);
            });
            
            // Clear chip objects array
            this.chipObjects[area] = [];
        });
    }
    
    moveComeBetToPoint(comeBet, pointPosition) {
        // Animate the chip moving to the point box
        const chip = comeBet.chipObject;
        const startPosition = chip.position.clone();
        const endPosition = pointPosition.clone();
        endPosition.y += 0.05; // Lift slightly above the table
        
        // Simple animation
        const duration = 1000; // ms
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Interpolate position
            chip.position.lerpVectors(startPosition, endPosition, progress);
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    updateComeBets(pointPositions) {
        // Update come bets that have moved to points
        this.gameState.bets.come.forEach(comeBet => {
            if (comeBet.point !== null && comeBet.chipObject) {
                // Move chip to the point box
                const pointPosition = pointPositions[comeBet.point];
                this.moveComeBetToPoint(comeBet, pointPosition);
            }
        });
    }
    
    // Method to clear all chips when a point is made or a 7 is rolled
    clearAllBetsOnPointOrSeven() {
        // Clear pass line and don't pass bets
        this.clearBets(['passLine', 'dontPass']);
        
        // Clear place bets
        this.clearBets(['point4', 'point5', 'point6', 'point8', 'point9', 'point10']);
        
        // Clear come bets
        this.gameState.bets.come.forEach(comeBet => {
            if (comeBet.chipObject) {
                this.scene.remove(comeBet.chipObject);
            }
        });
        
        // Clear hard way bets
        this.clearBets(['hard4', 'hard6', 'hard8', 'hard10']);
    }
    
    // Method to clear one-roll proposition bets
    clearOneRollBets() {
        this.clearBets(['seven', 'anyCraps', 'craps2', 'craps3', 'yo11', 'craps12', 'field']);
    }
    
    // Method to update the visual state of the table based on the current point
    updateTableState() {
        // Highlight the current point box if there is one
        if (this.gameState.point !== null) {
            // TODO: Highlight the point box in the 3D scene
        }
    }
} 