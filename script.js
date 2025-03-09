let balance = 1000;
let point = null;
let bets = {
    passLine: 0,
    passLineOdds: 0,
    dontPass: 0,
    dontPassOdds: 0,
    come: [],
    dontCome: [],
    field: 0,
    place: {
        4: 0,
        5: 0,
        6: 0,
        8: 0,
        9: 0,
        10: 0
    },
    hardways: {
        4: 0,
        6: 0,
        8: 0,
        10: 0
    },
    proposition: {
        anySeven: 0,
        anyCraps: 0,
        horn2: 0,
        horn12: 0
    },
    big6: 0,
    big8: 0
};

const PAYOUTS = {
    passLine: 1,
    dontPass: 1,
    field: {
        3: 1,
        4: 1,
        9: 1,
        10: 1,
        11: 1,
        2: 2,
        12: 2
    },
    place: {
        4: 1.8,  // 9:5
        5: 1.4,  // 7:5
        6: 1.17, // 7:6
        8: 1.17, // 7:6
        9: 1.4,  // 7:5
        10: 1.8  // 9:5
    },
    hardways: {
        4: 7,
        6: 9,
        8: 9,
        10: 7
    },
    proposition: {
        anySeven: 4,
        anyCraps: 7,
        horn2: 30,
        horn12: 30
    },
    big6: 1,
    big8: 1
};

const ODDS_LIMITS = {
    4: 3,  // 3x odds on 4 and 10
    5: 4,  // 4x odds on 5 and 9
    6: 5,  // 5x odds on 6 and 8
    8: 5,
    9: 4,
    10: 3
};

const ODDS_PAYOUTS = {
    // Pass Line Odds payouts (point number: multiplier)
    pass: {
        4: 2,    // 2:1 on 4 and 10
        5: 1.5,  // 3:2 on 5 and 9
        6: 1.2,  // 6:5 on 6 and 8
        8: 1.2,  // 6:5 on 8
        9: 1.5,  // 3:2 on 9
        10: 2    // 2:1 on 10
    },
    // Don't Pass Odds payouts (point number: multiplier)
    dontPass: {
        4: 0.5,   // 1:2 on 4 and 10
        5: 0.667, // 2:3 on 5 and 9
        6: 0.833, // 5:6 on 6 and 8
        8: 0.833, // 5:6 on 8
        9: 0.667, // 2:3 on 9
        10: 0.5   // 1:2 on 10
    }
};

const rollButton = document.getElementById('rollButton');
const die1Display = document.getElementById('die1');
const die2Display = document.getElementById('die2');
const balanceDisplay = document.getElementById('balance');
const pointDisplay = document.getElementById('point');
const bettingAreas = document.querySelectorAll('.betting-area, .proposition-box');
const numberBoxes = document.querySelectorAll('.number-box');
const chips = document.querySelectorAll('.chip');
const betTracker = document.getElementById('current-bets');
const lastWinDisplay = document.getElementById('last-win');
let totalBets = 0;

// Sound effect elements
const diceSound = document.getElementById('diceSound');
const chipSound = document.getElementById('chipSound');

// Function to play dice rolling sound
function playDiceSound() {
    diceSound.currentTime = 0;
    diceSound.play().catch(error => console.log('Error playing dice sound:', error));
}

// Function to play chip placement sound
function playChipSound() {
    chipSound.currentTime = 0;
    chipSound.play().catch(error => console.log('Error playing chip sound:', error));
}

// Initialize the last win display
document.getElementById('last-win').textContent = 'Won: $0';

// Enable drag-and-drop for chips
chips.forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', chip.dataset.value);
    });
});

// Make betting areas droppable
bettingAreas.forEach(area => {
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        const value = parseInt(e.dataTransfer.getData('text/plain'));
        
        if (balance < value) {
            alert("Not enough balance!");
            return;
        }

        placeBet(area.id, value);
        
        // Get exact drop position relative to the betting area
        const rect = area.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Play chip sound when placing the chip
        playChipSound();
        
        createChipElement(area, value, x, y);
        updateBetTracker();
    });
});

// Make odds areas droppable
document.querySelectorAll('.odds-area').forEach(area => {
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        const value = parseInt(e.dataTransfer.getData('text/plain'));
        const number = parseInt(area.dataset.odds);
        
        if (balance < value) {
            alert("Not enough balance!");
            return;
        }

        // Check if this is a valid odds bet
        if (!canPlaceOddsBet(number, value)) {
            alert("Invalid odds bet! Make sure you have a corresponding Pass Line or Come bet first.");
            return;
        }

        // Check if a chip with this value already exists in this area
        const existingChips = area.querySelectorAll('.chip');
        const existingValueChip = Array.from(existingChips).find(
            chip => parseInt(chip.dataset.value) === value
        );
        
        // If there's already a chip with this value, just update the bet amount
        if (existingValueChip) {
            placeOddsBet(number, value);
            updateBetTracker();
            playChipSound();
            return;
        }

        // Get exact drop position relative to the odds area
        const rect = area.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Play chip sound when placing the chip
        playChipSound();

        placeOddsBet(number, value);
        createChipElement(area, value, x, y);
        updateBetTracker();
    });
});

// Make number boxes droppable for place bets
numberBoxes.forEach(box => {
    box.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    box.addEventListener('drop', (e) => {
        e.preventDefault();
        const value = parseInt(e.dataTransfer.getData('text/plain'));
        const number = parseInt(box.dataset.number);
        
        if (balance < value) {
            alert("Not enough balance!");
            return;
        }
        
        // Play chip sound when placing the chip
        playChipSound();
        
        // Place bet on the number using placeBet function
        placeBet(`place${number}`, value);
        
        // Get exact drop position relative to the number box
        const rect = box.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        createChipElement(box, value, x, y);
        updateBetTracker();
    });
});

function createChipElement(area, value, x, y) {
    // Find the original chip from the rack
    const originalChip = document.querySelector(`#chip-rack .chip-${value}`);
    if (!originalChip) return null;
    
    // Create new chip by cloning the original
    const newChip = originalChip.cloneNode(true);
    newChip.removeAttribute('draggable');
    
    // Position the chip at the exact drop location
    if (!area.id || area.id !== 'chip-rack') {
        // Add placed-chip class but preserve the original chip class
        newChip.classList.add('placed-chip');
        
        // If this is an odds area, mark it as an odds chip
        if (area.classList.contains('odds-area')) {
            newChip.classList.add('odds-chip');
        }
        
        // Get existing chips in the area
        const existingChips = area.querySelectorAll('.chip');
        const chipCount = existingChips.length;
        
        // Alternate between left and right placement based on chip count
        const isEven = chipCount % 2 === 0;
        const horizontalOffset = isEven ? -15 : 15; // Alternate between left and right
        
        // Offset each chip horizontally and vertically
        newChip.style.left = `${x + horizontalOffset}px`;
        newChip.style.top = `${y - (chipCount * 8)}px`;
    }
    
    area.appendChild(newChip);
    updateBetTracker();
    return newChip;
}

function placeBet(areaId, amount) {
    // Update the bet tracker data
    if (areaId === 'passLine') {
        // Can only place Pass Line bets when point is off
        if (point === null) {
            bets.passLine += amount;
        } else {
            console.log("Cannot place Pass Line bet when point is established");
            return false;
        }
    } 
    else if (areaId === 'dontPass') {
        // Can only place Don't Pass bets when point is off
        if (point === null) {
            bets.dontPass += amount;
        } else {
            console.log("Cannot place Don't Pass bet when point is established");
            return false;
        }
    } 
    else if (areaId === 'field') {
        bets.field += amount;
    } 
    else if (areaId === 'come') {
        // Can only place Come bets when point is established
        if (point !== null) {
            // Add a new come bet to the array with a null point
            bets.come.push({
                amount: amount,
                point: null,
                odds: 0
            });
        } else {
            console.log("Cannot place Come bet when point is off");
            return false;
        }
    } 
    else if (areaId === 'dontCome') {
        // Can only place Don't Come bets when point is established
        if (point !== null) {
            // Add a new don't come bet to the array with a null point
            bets.dontCome.push({
                amount: amount,
                point: null,
                odds: 0
            });
        } else {
            console.log("Cannot place Don't Come bet when point is off");
            return false;
        }
    } 
    else if (areaId.startsWith('place')) {
        const number = parseInt(areaId.replace('place', ''));
        bets.place[number] += amount;
    }
    else if (areaId.startsWith('hardway')) {
        const number = parseInt(areaId.replace('hardway', ''));
        bets.hardways[number] += amount;
    } 
    else if (Object.keys(bets.proposition).includes(areaId)) {
        bets.proposition[areaId] += amount;
    }
    else {
        bets[areaId] += amount;
    }
    
    balance -= amount;
    updateBalance();
    updateBetTracker();
    return true;
}

function canPlaceOddsBet(number, value) {
    // Can only place odds bets on established points
    if (![4, 5, 6, 8, 9, 10].includes(number)) {
        return false;
    }
    
    // For Pass Line odds - can only place odds on the established point
    if (point === number && bets.passLine > 0) {
        const maxOdds = bets.passLine * ODDS_LIMITS[number];
        return (bets.passLineOdds + value) <= maxOdds;
    }

    // For Don't Pass odds - can only place odds on the established point
    if (point === number && bets.dontPass > 0) {
        const maxOdds = bets.dontPass * ODDS_LIMITS[number];
        return (bets.dontPassOdds + value) <= maxOdds;
    }

    // For Come bet odds - can only place odds on established Come points
    const comeBet = bets.come.find(bet => bet.point === number);
    if (comeBet) {
        const maxOdds = comeBet.amount * ODDS_LIMITS[number];
        return (comeBet.odds || 0) + value <= maxOdds;
    }

    // For Don't Come bet odds - can only place odds on established Don't Come points
    const dontComeBet = bets.dontCome.find(bet => bet.point === number);
    if (dontComeBet) {
        const maxOdds = dontComeBet.amount * ODDS_LIMITS[number];
        return (dontComeBet.odds || 0) + value <= maxOdds;
    }

    return false;
}

function placeOddsBet(number, value) {
    // Track the bet in the data model
    if (point === number && bets.passLine > 0) {
        // Pass Line odds
        bets.passLineOdds += value;
    } else if (bets.dontPass > 0 && point === number) {
        // Don't Pass odds
        bets.dontPassOdds += value;
    } else {
        // Come or Don't Come odds
        const comeBet = bets.come.find(bet => bet.point === number);
        if (comeBet) {
            // Come odds
            comeBet.odds = (comeBet.odds || 0) + value;
        } else {
            // Don't Come odds
            const dontComeBet = bets.dontCome.find(bet => bet.point === number);
            if (dontComeBet) {
                dontComeBet.odds = (dontComeBet.odds || 0) + value;
            }
        }
    }
}

rollButton.addEventListener('click', rollDice);

function rollDice() {
    playDiceSound();
    rollButton.disabled = true;
    
    // Reset win display
    const lastWin = document.getElementById('last-win');
    lastWin.textContent = 'Won: $0';
    lastWin.classList.remove('win-animation');
    
    die1Display.classList.add('rolling');
    die2Display.classList.add('rolling');
    
    // Clear existing dots
    die1Display.innerHTML = '';
    die2Display.innerHTML = '';
    
    setTimeout(() => {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        
        die1Display.classList.remove('rolling');
        die2Display.classList.remove('rolling');
        
        die1Display.innerHTML = getDieFace(die1);
        die2Display.innerHTML = getDieFace(die2);
        
        const sum = die1 + die2;
        
        // Check for hardway
        const isHardway = die1 === die2 && [4, 6, 8, 10].includes(sum);
        
        // Resolve field bets first (they work on every roll)
        resolveFieldBets(sum);
        
        // Resolve proposition bets
        resolvePropositionBets(sum, isHardway);
        
        // Resolve come/don't come bets - must do this BEFORE clearing the point
        // This ensures come bets on the same number as the point are properly paid
        resolveComeAndDontComeBets(sum);
        
        // Come-out roll (no point established)
        if (point === null) {
            if (sum === 7 || sum === 11) {
                // Natural - Pass Line wins, Don't Pass loses
                if (bets.passLine > 0) {
                    // Pass Line pays 1:1
                    const betAmount = bets.passLine;
                    const winAmount = betAmount; // Win amount is equal to bet (1:1)
                    balance += winAmount; // Only add winnings, keep the bet
                    showWin(winAmount); // Show just the winnings
                }
                // Don't clear Pass Line bet - it stays for next roll
                clearBet('dontPass');
            } 
            else if (sum === 2 || sum === 3) {
                // Craps - Pass Line loses, Don't Pass wins
                clearBet('passLine');
                if (bets.dontPass > 0) {
                    // Don't Pass pays 1:1
                    const betAmount = bets.dontPass;
                    const winAmount = betAmount;
                    balance += betAmount + winAmount;
                    showWin(betAmount + winAmount);
                }
                clearBet('dontPass');
            }
            else if (sum === 12) {
                // Craps - Pass Line loses, Don't Pass pushes (bars 12)
                clearBet('passLine');
                if (bets.dontPass > 0) {
                    balance += bets.dontPass; // Return original bet (push)
                }
                clearBet('dontPass');
            }
            else {
                // Point is established
                point = sum;
                pointDisplay.textContent = `Point: ${point}`;
                markActivePoint(point);
            }
        }
        // Point is established
        else {
            if (sum === point) {
                // Pass Line wins if point is made
                if (bets.passLine > 0) {
                    // Pass Line pays 1:1
                    const betAmount = bets.passLine;
                    const winAmount = betAmount;
                    balance += winAmount; // Only add winnings, keep the bet
                    showWin(winAmount); // Show just the winnings
                }
                // Pay Pass Line Odds at true odds
                if (bets.passLineOdds > 0) {
                    const oddsMultiplier = ODDS_PAYOUTS.pass[point];
                    const winAmount = bets.passLineOdds * oddsMultiplier;
                    balance += bets.passLineOdds + winAmount; // Return odds bet + win
                    showWin(winAmount); // Show just the winnings
                    clearBet('passLineOdds'); // Clear only the odds bet
                }
                // Don't clear the Pass Line bet - it stays for the next point
                clearBet('dontPass');
                clearBet('dontPassOdds');
                point = null;
                clearActivePoint();
                pointDisplay.textContent = 'Point: Off';
            }
            else if (sum === 7) {
                // Seven out - Pass Line loses
                clearBet('passLine');
                sevenOut();
            }
        }
        
        rollButton.disabled = false;
        updateBalance();
        updateBetTracker();
    }, 1000);
}

function getDieFace(value) {
    // Create dots pattern for dice faces
    switch (value) {
        case 1:
            return `<div class="dot center"></div>`;
        case 2:
            return `<div class="dot top-left"></div><div class="dot bottom-right"></div>`;
        case 3:
            return `<div class="dot top-left"></div><div class="dot center"></div><div class="dot bottom-right"></div>`;
        case 4:
            return `<div class="dot top-left"></div><div class="dot top-right"></div><div class="dot bottom-left"></div><div class="dot bottom-right"></div>`;
        case 5:
            return `<div class="dot top-left"></div><div class="dot top-right"></div><div class="dot center"></div><div class="dot bottom-left"></div><div class="dot bottom-right"></div>`;
        case 6:
            return `<div class="dot top-left"></div><div class="dot top-right"></div><div class="dot middle-left"></div><div class="dot middle-right"></div><div class="dot bottom-left"></div><div class="dot bottom-right"></div>`;
        default:
            return `<div class="dot center"></div>`;
    }
}

function resolveFieldBets(sum) {
    if (bets.field > 0) {
        if ([2, 3, 4, 9, 10, 11, 12].includes(sum)) {
            // Field bets pay 1:1, except 2 and 12 which pay 2:1
            const multiplier = (sum === 2 || sum === 12) ? 2 : 1;
            const betAmount = bets.field;
            const winAmount = betAmount * multiplier;
            balance += betAmount + winAmount; // Return bet + win
            showWin(betAmount + winAmount); // Show total return
        }
        clearBet('field');
    }
}

function sevenOut() {
    // Don't Pass bets win
    if (bets.dontPass > 0) {
        // Don't Pass pays 1:1
        const betAmount = bets.dontPass;
        const winAmount = betAmount;
        balance += betAmount + winAmount;
        showWin(betAmount + winAmount);
    }
    
    // Don't Pass Odds win at true odds
    if (bets.dontPassOdds > 0) {
        const oddsMultiplier = ODDS_PAYOUTS.dontPass[point];
        const winAmount = bets.dontPassOdds * oddsMultiplier;
        balance += bets.dontPassOdds + winAmount;
        showWin(bets.dontPassOdds + winAmount);
    }
    
    // Clear all bets
    clearBet('passLine'); // This will now properly clear Pass Line on seven-out
    clearBet('passLineOdds');
    clearBet('dontPass');
    clearBet('dontPassOdds');
    clearAllComeBets();
    
    // Reset point
    point = null;
    clearActivePoint();
    pointDisplay.textContent = 'Point: Off';
    
    // Clear any remaining chips from the table
    document.querySelectorAll('.betting-area .chip, .odds-area .chip, .number-box .chip').forEach(chip => {
        chip.remove();
    });
    
    // Reset all bet values while preserving the structure
    bets = {
        passLine: 0,
        passLineOdds: 0,
        dontPass: 0,
        dontPassOdds: 0,
        come: [],
        dontCome: [],
        field: 0,
        place: {
            4: 0,
            5: 0,
            6: 0,
            8: 0,
            9: 0,
            10: 0
        },
        hardways: {
            4: 0,
            6: 0,
            8: 0,
            10: 0
        },
        proposition: {
            anySeven: 0,
            anyCraps: 0,
            horn2: 0,
            horn12: 0
        }
    };
    
    updateBalance();
    updateBetTracker();
    
    // Re-enable betting
    document.querySelectorAll('.betting-area').forEach(area => {
        area.style.pointerEvents = 'auto';
    });
    
    // Make sure the roll button is enabled
    rollButton.disabled = false;
}

function resolveComeAndDontComeBets(sum) {
    // Resolve come bets
    for (let i = bets.come.length - 1; i >= 0; i--) {
        const bet = bets.come[i];
        if (bet.point === null) {
            // New come bet (still in the Come box)
            if (sum === 7 || sum === 11) {
                // Come bet wins even money (1:1)
                const betAmount = bet.amount;
                const winAmount = betAmount; // Win amount is equal to bet (1:1)
                balance += betAmount + winAmount; // Return bet + win
                showWin(betAmount + winAmount); // Show total return
                removeChipsFromArea('come', bet.amount);
                bets.come.splice(i, 1);
            } else if (sum === 2 || sum === 3 || sum === 12) {
                // Come bet loses
                removeChipsFromArea('come', bet.amount);
                bets.come.splice(i, 1);
            } else {
                // Come bet moves to number
                bet.point = sum;
                moveChipsFromAreaToNumber('come', sum, bet.amount);
            }
        } else if (sum === bet.point) {
            // Come bet wins on its point (1:1)
            const betAmount = bet.amount;
            const winAmount = betAmount; // Win amount is equal to bet (1:1)
            balance += betAmount + winAmount; // Return bet + win
            showWin(betAmount + winAmount); // Show total return
            
            // Pay odds if any at true odds - must be calculated before removing chips
            if (bet.odds && bet.odds > 0) {
                const oddsMultiplier = ODDS_PAYOUTS.pass[bet.point];
                const oddsWinAmount = bet.odds * oddsMultiplier;
                balance += bet.odds + oddsWinAmount; // Return bet + win
                showWin(bet.odds + oddsWinAmount); // Show total return
                
                // Find and remove the odds chips
                const oddsArea = document.querySelector(`.odds-area[data-odds="${bet.point}"]`);
                if (oddsArea) {
                    const oddsChips = oddsArea.querySelectorAll('.chip');
                    oddsChips.forEach(chip => chip.remove());
                }
            }
            
            // Remove just the come bet chip from the number box, not all chips
            const numberBox = document.querySelector(`.number-box[data-number="${bet.point}"]`);
            if (numberBox) {
                const comeChips = numberBox.querySelectorAll('.chip:not(.odds-chip)');
                comeChips.forEach(chip => chip.remove());
            }
            
            bets.come.splice(i, 1);
        } else if (sum === 7) {
            // Come bet loses on seven out if it has a point established
            // But any new come bets (with no point) should win on a 7
            
            // Just remove the come bet from this specific point
            const numberBox = document.querySelector(`.number-box[data-number="${bet.point}"]`);
            if (numberBox) {
                const comeChips = numberBox.querySelectorAll('.chip:not(.odds-chip)');
                comeChips.forEach(chip => chip.remove());
                
                // Also remove any associated odds chips
                const oddsArea = document.querySelector(`.odds-area[data-odds="${bet.point}"]`);
                if (oddsArea) {
                    const oddsChips = oddsArea.querySelectorAll('.chip');
                    oddsChips.forEach(chip => chip.remove());
                }
            }
            
            bets.come.splice(i, 1);
        }
    }
    
    // Check for any new come bets in the come box that would win on a 7
    const comeBets = document.querySelectorAll('#come .chip');
    comeBets.forEach(chip => {
        if (sum === 7) {
            // Any chips in the come box win on a 7 (1:1)
            const betAmount = parseInt(chip.dataset.value);
            const winAmount = betAmount; // Win amount is equal to bet (1:1)
            balance += betAmount + winAmount; // Return bet + win
            showWin(betAmount + winAmount); // Show total return
            chip.remove();
        }
    });
    
    // Update the bets.come array to remove any bet with null point
    // This is needed since we manually removed the chips above
    if (sum === 7) {
        bets.come = bets.come.filter(bet => bet.point !== null);
    }

    // Resolve don't come bets
    for (let i = bets.dontCome.length - 1; i >= 0; i--) {
        const bet = bets.dontCome[i];
        if (bet.point === null) {
            // New don't come bet
            if (sum === 7 || sum === 11) {
                // Don't come bet loses
                removeChipsFromArea('dontCome', bet.amount);
                bets.dontCome.splice(i, 1);
            } else if (sum === 2 || sum === 3) {
                // Don't come bet wins even money (1:1)
                const betAmount = bet.amount;
                const winAmount = betAmount; // Win amount is equal to bet (1:1)
                balance += betAmount + winAmount; // Return bet + win
                showWin(betAmount + winAmount); // Show total return
                removeChipsFromArea('dontCome', bet.amount);
                bets.dontCome.splice(i, 1);
            } else if (sum === 12) {
                // Don't come bet pushes on 12
                balance += bet.amount; // Return original bet
                removeChipsFromArea('dontCome', bet.amount);
                bets.dontCome.splice(i, 1);
            } else {
                // Don't come bet moves to number
                bet.point = sum;
                moveChipsFromAreaToNumber('dontCome', sum, bet.amount);
            }
        } else if (sum === 7) {
            // Don't come bet wins on seven out
            const betAmount = bet.amount;
            const winAmount = betAmount; // Win amount is equal to bet (1:1)
            balance += betAmount + winAmount; // Return bet + win
            showWin(betAmount + winAmount); // Show total return
            
            // Pay odds if any at true odds
            if (bet.odds && bet.odds > 0) {
                const oddsMultiplier = ODDS_PAYOUTS.dontPass[bet.point];
                const oddsWinAmount = bet.odds * oddsMultiplier;
                balance += bet.odds + oddsWinAmount; // Return bet + win
                showWin(bet.odds + oddsWinAmount); // Show total return
                
                // Remove the odds chips
                const oddsArea = document.querySelector(`.odds-area[data-odds="${bet.point}"]`);
                if (oddsArea) {
                    const oddsChips = oddsArea.querySelectorAll('.chip');
                    oddsChips.forEach(chip => chip.remove());
                }
            }
            
            // Remove just the don't come bet chip from the number box
            const numberBox = document.querySelector(`.number-box[data-number="${bet.point}"]`);
            if (numberBox) {
                const dontComeChips = numberBox.querySelectorAll('.chip:not(.odds-chip)');
                dontComeChips.forEach(chip => chip.remove());
            }
            
            bets.dontCome.splice(i, 1);
        } else if (sum === bet.point) {
            // Don't come bet loses when point is made
            
            // Remove just the don't come bet chip from the number box
            const numberBox = document.querySelector(`.number-box[data-number="${bet.point}"]`);
            if (numberBox) {
                const dontComeChips = numberBox.querySelectorAll('.chip:not(.odds-chip)');
                dontComeChips.forEach(chip => chip.remove());
                
                // Also remove any associated odds chips
                const oddsArea = document.querySelector(`.odds-area[data-odds="${bet.point}"]`);
                if (oddsArea) {
                    const oddsChips = oddsArea.querySelectorAll('.chip');
                    oddsChips.forEach(chip => chip.remove());
                }
            }
            
            bets.dontCome.splice(i, 1);
        }
    }
}

function removeChipsFromArea(areaId, amount) {
    const area = document.getElementById(areaId);
    if (!area) return;
    
    const chips = area.querySelectorAll('.chip');
    for (const chip of chips) {
        if (parseInt(chip.dataset.value) === amount) {
            chip.remove();
            break;
        }
    }
}

function removeChipsFromNumber(number) {
    const numberBox = document.querySelector(`.number-box[data-number="${number}"]`);
    if (!numberBox) return;
    
    const chips = numberBox.querySelectorAll('.chip');
    chips.forEach(chip => chip.remove());
}

function moveChipsFromAreaToNumber(areaId, number, amount) {
    const area = document.getElementById(areaId);
    if (!area) return;
    
    const chips = area.querySelectorAll('.chip');
    for (const chip of chips) {
        if (parseInt(chip.dataset.value) === amount) {
            moveChipToNumber(chip, area, number);
            break;
        }
    }
}

function moveChipToNumber(chip, fromArea, toNumber) {
    const numberBox = document.querySelector(`.number-box[data-number="${toNumber}"]`);
    if (!numberBox) return;

    const rect = numberBox.getBoundingClientRect();
    const fromRect = fromArea.getBoundingClientRect();
    
    // Create an exact copy of the chip for movement
    const movingChip = chip.cloneNode(true);
    movingChip.classList.remove('placed-chip');
    movingChip.classList.add('moving-chip');
    
    // Maintain exact position
    movingChip.style.position = 'fixed';
    movingChip.style.left = `${fromRect.left + parseInt(chip.style.left)}px`;
    movingChip.style.top = `${fromRect.top + parseInt(chip.style.top)}px`;
    
    document.body.appendChild(movingChip);
    
    // Get the odds area where the chip will be placed
    const oddsArea = numberBox.querySelector('.odds-area');
    if (!oddsArea) return;
    
    // Get existing chips count in the odds area for offset calculation
    const existingChips = oddsArea.querySelectorAll('.chip');
    const chipCount = existingChips.length;
    
    // Check if a chip with the same value already exists
    const chipValue = parseInt(chip.dataset.value);
    const existingValueChip = Array.from(existingChips).find(
        existingChip => parseInt(existingChip.dataset.value) === chipValue
    );
    
    // Calculate target position with alternating offset
    const isEven = chipCount % 2 === 0;
    const horizontalOffset = isEven ? -15 : 15;
    const targetX = rect.left + rect.width/2 + horizontalOffset;
    const targetY = rect.top + rect.height/2 - (chipCount * 8);
    
    // Trigger movement to offset position
    requestAnimationFrame(() => {
        movingChip.style.left = `${targetX}px`;
        movingChip.style.top = `${targetY}px`;
    });
    
    // Remove original and moving chip after animation
    setTimeout(() => {
        chip.remove();
        movingChip.remove();
        
        // Only create a new chip if one with the same value doesn't exist
        if (!existingValueChip) {
            createChipElement(
                oddsArea, 
                chipValue,
                oddsArea.offsetWidth/2,
                oddsArea.offsetHeight/2
            );
        }
    }, 550);
}

function clearAllBets() {
    // Clear all come bets
    clearAllComeBets();
    
    // Clear all place bets
    clearAllPlaceBets();
    
    // Clear all hardway bets
    clearAllHardwayBets();
    
    // Clear all proposition bets
    clearAllPropositionBets();
    
    // Clear all chips from the table
    document.querySelectorAll('.betting-area .chip, .odds-area .chip, .number-box .chip').forEach(chip => {
        chip.remove();
    });
    
    // Reset all bet values but maintain the game state
    bets = {
        passLine: 0,
        passLineOdds: 0,
        dontPass: 0,
        dontPassOdds: 0,
        come: [],
        dontCome: [],
        field: 0,
        place: {
            4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0
        },
        hardways: {
            4: 0, 6: 0, 8: 0, 10: 0
        },
        proposition: {
            anySeven: 0,
            anyCraps: 0,
            horn2: 0,
            horn12: 0
        },
        big6: 0,
        big8: 0
    };
    
    updateBetTracker();
}

function clearAllComeBets() {
    bets.come.forEach(bet => {
        if (bet.odds) {
            const oddsArea = document.querySelector(`.odds-area[data-odds="${bet.point}"]`);
            if (oddsArea) {
                clearBetDisplay(oddsArea);
            }
        }
    });
    bets.come = [];
}

function payoutBet(betType, multiplier = 1) {
    let totalReturn = 0;
    if (betType.includes('place')) {
        const number = parseInt(betType.replace('place', ''));
        const winAmount = bets.place[number] * PAYOUTS.place[number];
        balance += bets.place[number] + winAmount; // Return bet plus winnings
        totalReturn = bets.place[number] + winAmount;
        bets.place[number] = 0;
    } else if (betType.includes('hardway')) {
        const number = parseInt(betType.replace('hardway', ''));
        const winAmount = bets.hardways[number] * PAYOUTS.hardways[number];
        balance += bets.hardways[number] + winAmount;
        totalReturn = bets.hardways[number] + winAmount;
        bets.hardways[number] = 0;
    } else if (Object.keys(bets.proposition).includes(betType)) {
        const winAmount = bets.proposition[betType] * PAYOUTS.proposition[betType];
        balance += bets.proposition[betType] + winAmount;
        totalReturn = bets.proposition[betType] + winAmount;
        bets.proposition[betType] = 0;
    } else {
        // Pass Line and Don't Pass pay even money
        const winAmount = bets[betType];
        balance += bets[betType] * 2; // Return bet plus win
        totalReturn = bets[betType] * 2;
        bets[betType] = 0;
    }
    
    clearBetDisplay(betType);
    updateBalance();
    updateBetTracker();
    if (totalReturn > 0) {
        showWin(totalReturn); // Show total amount returned
    }
}

function clearBet(betType) {
    if (betType.includes('place')) {
        const number = parseInt(betType.replace('place', ''));
        bets.place[number] = 0;
    } else if (betType.includes('hardway')) {
        const number = parseInt(betType.replace('hardway', ''));
        bets.hardways[number] = 0;
    } else if (Object.keys(bets.proposition).includes(betType)) {
        bets.proposition[betType] = 0;
    } else {
        // For Pass Line, only clear the bet amount if it's a loss
        if (betType === 'passLine' && bets[betType] > 0) {
            // If this is a seven-out or craps loss, clear everything
            if (point === null || point === 7) {
                bets[betType] = 0;
                const area = document.getElementById(betType);
                if (area) {
                    const chips = area.querySelectorAll('.chip');
                    chips.forEach(chip => chip.remove());
                }
            }
            // Otherwise (win), keep the bet and chips
        } else {
            // For all other bets, clear as normal
            bets[betType] = 0;
            const area = document.getElementById(betType);
            if (area) {
                const chips = area.querySelectorAll('.chip');
                chips.forEach(chip => chip.remove());
            }
        }
    }
    
    // Also clear any associated odds area if this is a Pass Line bet
    if (betType === 'passLine' && point !== null) {
        const oddsArea = document.querySelector(`.odds-area[data-odds="${point}"]`);
        if (oddsArea) {
            const oddsChips = oddsArea.querySelectorAll('.chip');
            oddsChips.forEach(chip => chip.remove());
        }
        bets.passLineOdds = 0;
    }
    
    updateBetTracker();
}

function clearBetDisplay(betType) {
    const area = document.getElementById(betType);
    if (area) {
        const chips = area.querySelectorAll('.chip');
        chips.forEach(chip => chip.remove());
    }
}

function clearAllPlaceBets() {
    Object.keys(bets.place).forEach(number => {
        bets.place[number] = 0;
        clearBetDisplay(`place${number}`);
    });
}

function clearAllPropositionBets() {
    Object.keys(bets.proposition).forEach(betType => {
        bets.proposition[betType] = 0;
        clearBetDisplay(betType);
    });
}

function markActivePoint(number) {
    clearActivePoint();
    const numberBox = document.querySelector(`.number-box[data-number="${number}"]`);
    if (numberBox) numberBox.classList.add('active');
}

function clearActivePoint() {
    numberBoxes.forEach(box => box.classList.remove('active'));
}

function returnBet(betType) {
    balance += bets[betType];
    clearBet(betType);
}

function updateBalance() {
    balanceDisplay.textContent = `Balance: $${balance}`;
}

function updateBetTracker() {
    totalBets = Object.values(bets).reduce((sum, bet) => {
        if (typeof bet === 'number') {
            return sum + bet;
        } else if (Array.isArray(bet)) {
            return sum + bet.reduce((s, b) => s + b.amount + (b.odds || 0), 0);
        } else if (typeof bet === 'object') {
            return sum + Object.values(bet).reduce((s, v) => s + v, 0);
        }
        return sum;
    }, 0);
    betTracker.textContent = `Total Bets: $${totalBets}`;
}

function showWin(amount) {
    if (amount <= 0) return;
    
    const lastWin = document.getElementById('last-win');
    lastWin.textContent = `Won: $${amount}`;
    lastWin.classList.add('win-animation');
    
    setTimeout(() => {
        lastWin.classList.remove('win-animation');
    }, 3000);
}

function clearAllHardwayBets() {
    if (bets.hardways) {
        Object.keys(bets.hardways).forEach(number => {
            bets.hardways[number] = 0;
        });
    }
}

function resolvePropositionBets(sum, isHardway) {
    // Any Seven
    if (sum === 7 && bets.proposition.anySeven > 0) {
        const winAmount = bets.proposition.anySeven * PAYOUTS.proposition.anySeven;
        balance += bets.proposition.anySeven + winAmount;
        showWin(bets.proposition.anySeven + winAmount);
    }
    
    // Any Craps
    if ((sum === 2 || sum === 3 || sum === 12) && bets.proposition.anyCraps > 0) {
        const winAmount = bets.proposition.anyCraps * PAYOUTS.proposition.anyCraps;
        balance += bets.proposition.anyCraps + winAmount;
        showWin(bets.proposition.anyCraps + winAmount);
    }
    
    // Horn bets
    if (sum === 2 && bets.proposition.horn2 > 0) {
        const winAmount = bets.proposition.horn2 * PAYOUTS.proposition.horn2;
        balance += bets.proposition.horn2 + winAmount;
        showWin(bets.proposition.horn2 + winAmount);
    }
    if (sum === 12 && bets.proposition.horn12 > 0) {
        const winAmount = bets.proposition.horn12 * PAYOUTS.proposition.horn12;
        balance += bets.proposition.horn12 + winAmount;
        showWin(bets.proposition.horn12 + winAmount);
    }
    
    // Clear all proposition bets after each roll
    clearAllPropositionBets();
}

// Function to display craps rules
function showCrapsRules() {
    const rulesContent = `
        <h2>Craps Rules</h2>
        
        <h3>Pass Line Bet</h3>
        <p><strong>Come-Out Roll:</strong></p>
        <ul>
            <li>Wins on 7 or 11 (pays 1:1)</li>
            <li>Loses on 2, 3, or 12</li>
            <li>Any other number (4, 5, 6, 8, 9, 10) establishes the "point"</li>
        </ul>
        <p><strong>After Point Established:</strong></p>
        <ul>
            <li>Wins if point is rolled again before 7 (pays 1:1)</li>
            <li>Loses if 7 is rolled before the point</li>
        </ul>
        
        <h3>Come Bet</h3>
        <p>Can only be placed after a point is established.</p>
        <ul>
            <li>Wins on 7 or 11 (pays 1:1)</li>
            <li>Loses on 2, 3, or 12</li>
            <li>Any other number becomes the "Come Point"</li>
            <li>Wins if Come Point is rolled before 7 (pays 1:1)</li>
            <li>Loses if 7 is rolled before the Come Point</li>
        </ul>
        
        <h3>Odds Bets</h3>
        <p>Can be placed behind Pass Line or Come bets after a point is established.</p>
        <p><strong>Payouts:</strong></p>
        <ul>
            <li>4 or 10: Pays 2:1</li>
            <li>5 or 9: Pays 3:2</li>
            <li>6 or 8: Pays 6:5</li>
        </ul>
        
        <h3>Field Bet</h3>
        <p>One-roll bet that wins if 2, 3, 4, 9, 10, 11, or 12 is rolled.</p>
        <ul>
            <li>2 and 12 pay 2:1</li>
            <li>All other field numbers pay 1:1</li>
        </ul>
    `;
    
    // Create a modal to display the rules
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.maxWidth = '600px';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflow = 'auto';
    modalContent.innerHTML = rulesContent;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#005C29';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Add a rules button to the game
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dice
    die1Display = document.getElementById('die1');
    die2Display = document.getElementById('die2');
    
    // Initialize dice with random faces to look like real dice
    const initialDie1 = Math.floor(Math.random() * 6) + 1;
    const initialDie2 = Math.floor(Math.random() * 6) + 1;
    die1Display.innerHTML = getDieFace(initialDie1);
    die2Display.innerHTML = getDieFace(initialDie2);
    
    // Initialize point display
    pointDisplay = document.getElementById('point');
    
    // Initialize roll button
    rollButton = document.getElementById('rollButton');
    rollButton.addEventListener('click', rollDice);
    
    // Initialize last win display
    lastWinDisplay = document.getElementById('last-win');
    
    // Initialize chip rack
    initializeChipRack();
    
    // Initialize betting areas
    initializeBettingAreas();
    
    // Add rules button
    const rulesButton = document.createElement('button');
    rulesButton.textContent = 'Game Rules';
    rulesButton.style.marginTop = '10px';
    rulesButton.style.padding = '8px 15px';
    rulesButton.style.backgroundColor = '#333';
    rulesButton.style.color = 'white';
    rulesButton.style.border = 'none';
    rulesButton.style.borderRadius = '5px';
    rulesButton.style.cursor = 'pointer';
    rulesButton.addEventListener('click', showCrapsRules);
    
    // Add the rules button to the game controls
    const gameControls = document.querySelector('.game-controls');
    if (gameControls) {
        gameControls.appendChild(rulesButton);
    } else {
        document.body.appendChild(rulesButton);
    }
    
    // Update initial balance and bet tracker
    updateBalance();
    updateBetTracker();
});
