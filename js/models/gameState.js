export class GameState {
    constructor(updateUICallback) {
        this.balance = 100;
        this.point = null;
        this.isRolling = false;
        this.bets = {
            // Basic bets
            passLine: 0,
            dontPass: 0,
            field: 0,
            come: [], // Array of {amount, point, chipObject}
            
            // Proposition bets
            seven: 0,
            hard4: 0,
            hard6: 0,
            hard8: 0,
            hard10: 0,
            anyCraps: 0,
            craps2: 0,
            craps3: 0,
            yo11: 0,
            craps12: 0,
            
            // Place bets
            point4: 0,
            point5: 0,
            point6: 0,
            point8: 0,
            point9: 0,
            point10: 0
        };
        this.updateUI = updateUICallback;
    }

    placeBet(area, amount) {
        // Check if player has enough balance
        if (this.balance < amount) {
            console.error('Not enough balance!');
            return false;
        }

        // Place bet based on area
        if (area === 'come') {
            this.bets.come.push({ amount, point: null });
        } else {
            this.bets[area] += amount;
        }

        // Deduct from balance
        this.balance -= amount;
        this.updateUI();
        return true;
    }

    resolveBets(die1Value, die2Value) {
        const sum = die1Value + die2Value;
        console.log(`Dice rolled: ${die1Value} + ${die2Value} = ${sum}`);

        if (this.point === null) {
            // Come-out roll
            this.resolveComingOutRoll(sum);
        } else {
            // Point is set
            this.resolvePointRoll(sum);
        }

        // Resolve Field bet
        this.resolveFieldBet(sum);

        // Resolve Come bets
        this.resolveComeBets(sum);
        
        // Resolve Proposition bets
        this.resolvePropositionBets(sum, die1Value, die2Value);
        
        // Resolve Place bets
        this.resolvePlaceBets(sum);

        // Update UI
        this.updateUI();
    }

    resolveComingOutRoll(sum) {
        if (sum === 7 || sum === 11) {
            // Pass line wins, don't pass loses
            if (this.bets.passLine > 0) {
                this.balance += this.bets.passLine * 2;
                console.log(`Pass line wins: +$${this.bets.passLine * 2}`);
            }
            this.resetBets(['passLine', 'dontPass']);
        } else if (sum === 2 || sum === 3 || sum === 12) {
            // Pass line loses, don't pass wins (except on 12)
            if (this.bets.dontPass > 0 && sum !== 12) {
                this.balance += this.bets.dontPass * 2;
                console.log(`Don't pass wins: +$${this.bets.dontPass * 2}`);
            }
            this.resetBets(['passLine', 'dontPass']);
        } else {
            // Point is established
            this.point = sum;
            console.log(`Point established: ${sum}`);
        }
    }

    resolvePointRoll(sum) {
        if (sum === this.point) {
            // Pass line wins, don't pass loses
            if (this.bets.passLine > 0) {
                this.balance += this.bets.passLine * 2;
                console.log(`Pass line wins on point: +$${this.bets.passLine * 2}`);
            }
            this.resetBets(['passLine', 'dontPass']);
            this.point = null;
        } else if (sum === 7) {
            // Pass line loses, don't pass wins
            if (this.bets.dontPass > 0) {
                this.balance += this.bets.dontPass * 2;
                console.log(`Don't pass wins on 7: +$${this.bets.dontPass * 2}`);
            }
            this.resetBets(['passLine', 'dontPass']);
            
            // All place bets lose on a 7
            this.resetBets(['point4', 'point5', 'point6', 'point8', 'point9', 'point10']);
        }
    }

    resolveFieldBet(sum) {
        if (this.bets.field > 0) {
            if ([2, 3, 4, 9, 10, 11, 12].includes(sum)) {
                // Field bet wins
                const multiplier = (sum === 2 || sum === 12) ? 3 : 2; // Double on 2 or 12
                this.balance += this.bets.field * multiplier;
                console.log(`Field bet wins: +$${this.bets.field * multiplier}`);
            }
            this.bets.field = 0;
        }
    }

    resolveComeBets(sum) {
        for (let i = this.bets.come.length - 1; i >= 0; i--) {
            const comeBet = this.bets.come[i];
            
            if (comeBet.point === null) {
                // New come bet
                if (sum === 7 || sum === 11) {
                    // Come bet wins
                    this.balance += comeBet.amount * 2;
                    console.log(`Come bet wins: +$${comeBet.amount * 2}`);
                    this.bets.come.splice(i, 1);
                } else if (sum === 2 || sum === 3 || sum === 12) {
                    // Come bet loses
                    console.log(`Come bet loses: -$${comeBet.amount}`);
                    this.bets.come.splice(i, 1);
                } else {
                    // Come bet moves to number
                    comeBet.point = sum;
                    console.log(`Come bet moved to ${sum}`);
                }
            } else {
                // Come bet on a number
                if (sum === comeBet.point) {
                    // Come bet wins
                    this.balance += comeBet.amount * 2;
                    console.log(`Come bet on ${comeBet.point} wins: +$${comeBet.amount * 2}`);
                    this.bets.come.splice(i, 1);
                } else if (sum === 7) {
                    // Come bet loses
                    console.log(`Come bet on ${comeBet.point} loses: -$${comeBet.amount}`);
                    this.bets.come.splice(i, 1);
                }
            }
        }
    }
    
    resolvePropositionBets(sum, die1Value, die2Value) {
        // Seven (Any 7) - pays 4:1
        if (sum === 7 && this.bets.seven > 0) {
            this.balance += this.bets.seven * 5; // Original bet + 4x winnings
            console.log(`Seven bet wins: +$${this.bets.seven * 5}`);
        }
        
        // Hard ways - pays when both dice show the same value
        const isHardWay = die1Value === die2Value;
        
        // Hard 4 (2+2) - pays 7:1
        if (sum === 4 && isHardWay && this.bets.hard4 > 0) {
            this.balance += this.bets.hard4 * 8; // Original bet + 7x winnings
            console.log(`Hard 4 bet wins: +$${this.bets.hard4 * 8}`);
        } else if ((sum === 4 && !isHardWay) || sum === 7) {
            // Hard 4 loses on easy 4 (3+1) or any 7
            this.bets.hard4 = 0;
        }
        
        // Hard 6 (3+3) - pays 9:1
        if (sum === 6 && isHardWay && this.bets.hard6 > 0) {
            this.balance += this.bets.hard6 * 10; // Original bet + 9x winnings
            console.log(`Hard 6 bet wins: +$${this.bets.hard6 * 10}`);
        } else if ((sum === 6 && !isHardWay) || sum === 7) {
            // Hard 6 loses on easy 6 (5+1, 4+2) or any 7
            this.bets.hard6 = 0;
        }
        
        // Hard 8 (4+4) - pays 9:1
        if (sum === 8 && isHardWay && this.bets.hard8 > 0) {
            this.balance += this.bets.hard8 * 10; // Original bet + 9x winnings
            console.log(`Hard 8 bet wins: +$${this.bets.hard8 * 10}`);
        } else if ((sum === 8 && !isHardWay) || sum === 7) {
            // Hard 8 loses on easy 8 (6+2, 5+3) or any 7
            this.bets.hard8 = 0;
        }
        
        // Hard 10 (5+5) - pays 7:1
        if (sum === 10 && isHardWay && this.bets.hard10 > 0) {
            this.balance += this.bets.hard10 * 8; // Original bet + 7x winnings
            console.log(`Hard 10 bet wins: +$${this.bets.hard10 * 8}`);
        } else if ((sum === 10 && !isHardWay) || sum === 7) {
            // Hard 10 loses on easy 10 (6+4) or any 7
            this.bets.hard10 = 0;
        }
        
        // Any Craps (2, 3, or 12) - pays 7:1
        if ((sum === 2 || sum === 3 || sum === 12) && this.bets.anyCraps > 0) {
            this.balance += this.bets.anyCraps * 8; // Original bet + 7x winnings
            console.log(`Any Craps bet wins: +$${this.bets.anyCraps * 8}`);
        }
        
        // Craps 2 - pays 30:1
        if (sum === 2 && this.bets.craps2 > 0) {
            this.balance += this.bets.craps2 * 31; // Original bet + 30x winnings
            console.log(`Craps 2 bet wins: +$${this.bets.craps2 * 31}`);
        }
        
        // Craps 3 - pays 15:1
        if (sum === 3 && this.bets.craps3 > 0) {
            this.balance += this.bets.craps3 * 16; // Original bet + 15x winnings
            console.log(`Craps 3 bet wins: +$${this.bets.craps3 * 16}`);
        }
        
        // Yo (11) - pays 15:1
        if (sum === 11 && this.bets.yo11 > 0) {
            this.balance += this.bets.yo11 * 16; // Original bet + 15x winnings
            console.log(`Yo (11) bet wins: +$${this.bets.yo11 * 16}`);
        }
        
        // Craps 12 - pays 30:1
        if (sum === 12 && this.bets.craps12 > 0) {
            this.balance += this.bets.craps12 * 31; // Original bet + 30x winnings
            console.log(`Craps 12 bet wins: +$${this.bets.craps12 * 31}`);
        }
        
        // Reset one-roll proposition bets
        this.resetBets(['seven', 'anyCraps', 'craps2', 'craps3', 'yo11', 'craps12']);
    }
    
    resolvePlaceBets(sum) {
        // Place bets win when their number is rolled (except during come-out roll)
        if (this.point !== null) {
            // Place 4 - pays 9:5
            if (sum === 4 && this.bets.point4 > 0) {
                const winnings = this.bets.point4 * 1.8; // 9:5 ratio
                this.balance += this.bets.point4 + winnings;
                console.log(`Place 4 bet wins: +$${winnings.toFixed(2)}`);
            }
            
            // Place 5 - pays 7:5
            if (sum === 5 && this.bets.point5 > 0) {
                const winnings = this.bets.point5 * 1.4; // 7:5 ratio
                this.balance += this.bets.point5 + winnings;
                console.log(`Place 5 bet wins: +$${winnings.toFixed(2)}`);
            }
            
            // Place 6 - pays 7:6
            if (sum === 6 && this.bets.point6 > 0) {
                const winnings = this.bets.point6 * (7/6); // 7:6 ratio
                this.balance += this.bets.point6 + winnings;
                console.log(`Place 6 bet wins: +$${winnings.toFixed(2)}`);
            }
            
            // Place 8 - pays 7:6
            if (sum === 8 && this.bets.point8 > 0) {
                const winnings = this.bets.point8 * (7/6); // 7:6 ratio
                this.balance += this.bets.point8 + winnings;
                console.log(`Place 8 bet wins: +$${winnings.toFixed(2)}`);
            }
            
            // Place 9 - pays 7:5
            if (sum === 9 && this.bets.point9 > 0) {
                const winnings = this.bets.point9 * 1.4; // 7:5 ratio
                this.balance += this.bets.point9 + winnings;
                console.log(`Place 9 bet wins: +$${winnings.toFixed(2)}`);
            }
            
            // Place 10 - pays 9:5
            if (sum === 10 && this.bets.point10 > 0) {
                const winnings = this.bets.point10 * 1.8; // 9:5 ratio
                this.balance += this.bets.point10 + winnings;
                console.log(`Place 10 bet wins: +$${winnings.toFixed(2)}`);
            }
        }
    }

    resetBets(areas = []) {
        areas.forEach(area => {
            this.bets[area] = 0;
        });
    }
} 