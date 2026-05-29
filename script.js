const display = document.getElementById("display");
const historyDiv = document.getElementById("history");
const buttons = document.querySelectorAll('.btn');
let currentInput = '';
let lastResult = '';

buttons.forEach(button => {
    button.addEventListener('click', () => {
        handleInput(button.getAttribute('data-value'));
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || ['+', '-', '*', '/', '.', '%'].includes(e.key)) {
        handleInput(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        handleInput('=');
    } else if (e.key === 'Backspace') {
        handleInput('DEL');
    } else if (e.key === 'Escape') {
        handleInput('CE');
    }
});

function handleInput(value) {
    if (value === 'CE') {
        currentInput = '';
        display.value = '';
        historyDiv.textContent = '';
    }
    else if (value === 'DEL') {
        currentInput = currentInput.slice(0, -1);
        display.value = currentInput;
    }
    else if (value === '=') {
        if (currentInput === '') return;
        try {
            historyDiv.textContent = currentInput + ' =';
            let expression = currentInput.replace(/%/g, '/100');
            let result = eval(expression);

            // Fix floating point issues
            result = Math.round(result * 100000000) / 100000000;
            currentInput = result.toString();
            display.value = currentInput;
            lastResult = currentInput;
        } catch {
            display.value = 'Error';
            currentInput = '';
            historyDiv.textContent = '';
        }
    }
    else {
        // If last action was = and user types number, start fresh
        if (lastResult === currentInput && !isNaN(value)) {
            currentInput = '';
            historyDiv.textContent = '';
        }
        currentInput += value;
        display.value = currentInput;
        lastResult = '';
    }
}