let balance = 100;
let point = null;
let bets = {
    passLine: 0,
    dontPass: 0,
    field: 0,
    come: [] // Array of {amount, point, chipElement}
};

const rollButton = document.getElementById('rollButton');
const die1Display = document.getElementById('die1');
const die2Display = document.getElementById('die2');
const balanceDisplay = document.getElementById('balance');
const pointDisplay = document.getElementById('point');
const bettingAreas = document.querySelectorAll('.betting-area');
const chips = document.querySelectorAll('.chip');
const numberBoxes = document.querySelectorAll('.number-box');

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
        const newChip = document.createElement('div');
        newChip.className = `chip chip-${value}`;
        newChip.innerHTML = `<span>$${value}</span>`;
        area.appendChild(newChip);
        if (area.id === 'come') {
            bets.come.push({ amount: value, point: null, chipElement: newChip });
        } else {
            bets[area.id] += value;
        }
        balance -= value;
        updateBalance();
    });
});

rollButton.addEventListener('click', rollDice);

function rollDice() {
    rollButton.disabled = true;
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const sum = die1 + die2;
    let animationCount = 0;
    const animationInterval = setInterval(() => {
        const tempDie1 = Math.floor(Math.random() * 6) + 1;
        const tempDie2 = Math.floor(Math.random() * 6) + 1;
        die1Display.innerHTML = getDieFace(tempDie1);
        die2Display.innerHTML = getDieFace(tempDie2);
        animationCount++;
        if (animationCount >= 10) {
            clearInterval(animationInterval);
            die1Display.innerHTML = getDieFace(die1);
            die2Display.innerHTML = getDieFace(die2);
            resolveBets(sum);
            rollButton.disabled = false;
        }
    }, 100);
}

function getDieFace(value) {
    return String.fromCharCode(0x2680 + value - 1);
}

function resolveBets(sum) {
    if (point === null) {
        // Come-out roll
        if (sum === 7 || sum === 11) {
            if (bets.passLine > 0) balance += bets.passLine * 2;
            resetBets();
        } else if (sum === 2 || sum === 3 || sum === 12) {
            if (bets.dontPass > 0 && sum !== 12) balance += bets.dontPass * 2;
            resetBets();
        } else {
            point = sum;
            pointDisplay.textContent = `Point: ${point}`;
            markActivePoint(sum);
        }
    } else {
        // Point is set
        if (sum === point) {
            if (bets.passLine > 0) balance += bets.passLine * 2;
            resetBets();
            point = null;
            pointDisplay.textContent = 'Point: none';
            clearActivePoint();
        } else if (sum === 7) {
            if (bets.dontPass > 0) balance += bets.dontPass * 2;
            resetBets();
            point = null;
            pointDisplay.textContent = 'Point: none';
            clearActivePoint();
        }
    }

    // Resolve Field bet
    if (bets.field > 0) {
        if ([2, 3, 4, 9, 10, 11, 12].includes(sum)) balance += bets.field * 2;
        bets.field = 0;
        clearBetsFromArea(document.getElementById('field'));
    }

    // Resolve Come bets
    for (let i = bets.come.length - 1; i >= 0; i--) {
        let comeBet = bets.come[i];
        if (comeBet.point === null) {
            if (sum === 7 || sum === 11) {
                balance += comeBet.amount * 2;
                comeBet.chipElement.remove();
                bets.come.splice(i, 1);
            } else if (sum === 2 || sum === 3 || sum === 12) {
                comeBet.chipElement.remove();
                bets.come.splice(i, 1);
            } else {
                comeBet.point = sum;
                const numberBox = document.querySelector(`.number-box[data-number="${sum}"]`);
                numberBox.appendChild(comeBet.chipElement);
            }
        } else {
            if (sum === comeBet.point) {
                balance += comeBet.amount * 2;
                comeBet.chipElement.remove();
                bets.come.splice(i, 1);
            } else if (sum === 7) {
                comeBet.chipElement.remove();
                bets.come.splice(i, 1);
            }
        }
    }

    updateBalance();
}

function markActivePoint(number) {
    clearActivePoint();
    const numberBox = document.querySelector(`.number-box[data-number="${number}"]`);
    numberBox.classList.add('active');
}

function clearActivePoint() {
    numberBoxes.forEach(box => box.classList.remove('active'));
}

function resetBets() {
    bets.passLine = 0;
    bets.dontPass = 0;
    clearBetsFromArea(document.getElementById('passLine'));
    clearBetsFromArea(document.getElementById('dontPass'));
}

function clearBetsFromArea(area) {
    const chips = area.querySelectorAll('.chip');
    chips.forEach(chip => chip.remove());
}

function updateBalance() {
    balanceDisplay.textContent = `Balance: $${balance}`;
}
