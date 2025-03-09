# 3D Craps Game

A realistic 3D implementation of the classic casino game Craps using Three.js and Cannon.js for physics.

## Features

- Realistic 3D craps table
- Physics-based dice rolling with Cannon.js
- Interactive betting system
- Realistic 3D chips
- Camera controls to view the table from different angles

## Technologies Used

- Three.js for 3D rendering
- Cannon.js for physics simulation
- JavaScript ES6+ modules
- Express for serving the application

## How to Play

1. Select a chip by clicking on it in the chip rack
2. Click on a betting area to place your bet
3. Click the "Roll Dice" button to roll the dice
4. Watch the dice roll and see if you win!

### Betting Options

- **Pass Line**: Bet on the shooter rolling a 7 or 11 on the come-out roll, or making their point before rolling a 7.
- **Don't Pass**: Bet against the shooter. Win if they roll a 2 or 3 on the come-out roll, or if they roll a 7 before making their point.
- **Field**: One-roll bet that wins if 2, 3, 4, 9, 10, 11, or 12 is rolled.
- **Come**: Similar to Pass Line, but can be placed after the point is established.

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Controls

- **Left Mouse Button + Drag**: Rotate the camera
- **Right Mouse Button + Drag**: Pan the camera
- **Scroll Wheel**: Zoom in/out

## Development

This project uses ES6 modules. The main files are:

- `js/main.js`: Main entry point
- `js/models/table.js`: 3D table model
- `js/models/dice.js`: 3D dice with physics
- `js/models/chips.js`: 3D chip models
- `js/models/gameState.js`: Game logic
- `js/models/bettingManager.js`: Betting system

## License

MIT 