// script.js - Premium Calculator Logic
(function() {
    // DOM elements
    const display = document.getElementById('display');
    const historySpan = document.getElementById('historyExpr');
    
    // State
    let currentInput = '';
    let lastResult = '';
    let justEvaluated = false;
    let errorFlag = false;
    
    // Helper: Update display
    function updateDisplayUI() {
        if (currentInput === '') {
            display.value = '';
            display.placeholder = '0';
        } else {
            display.value = currentInput;
            display.placeholder = '';
        }
    }
    
    // Helper: Update history
    function setHistory(content) {
        if (content === undefined) {
            if (currentInput !== '' && !justEvaluated && !errorFlag) {
                historySpan.textContent = currentInput;
            } else if (currentInput === '' && !errorFlag) {
                historySpan.textContent = '✨ ready';
            }
        } else {
            historySpan.textContent = content;
        }
    }
    
    // Reset everything
    function resetAll() {
        currentInput = '';
        lastResult = '';
        justEvaluated = false;
        errorFlag = false;
        updateDisplayUI();
        historySpan.textContent = '✨ ready';
    }
    
    // Safe evaluation with % support
    function evaluateExpression(expr) {
        let processed = expr.replace(/÷/g, '/').replace(/×/g, '*');
        processed = processed.replace(/(\d+(?:\.\d+)?)%/g, (_, num) => `(${num}/100)`);
        processed = processed.replace(/(\.\d+)%/g, (_, num) => `(${num}/100)`);
        if (processed.trim() === '') throw new Error('empty');
        const fn = new Function(`'use strict'; return (${processed})`);
        let result = fn();
        if (!isFinite(result) || isNaN(result)) throw new Error('math error');
        result = parseFloat(result.toFixed(10));
        if (Math.abs(result - Math.round(result)) < 1e-12) result = Math.round(result);
        return result;
    }
    
    // Calculate result
    function computeResult() {
        if (errorFlag) {
            resetAll();
            return;
        }
        if (currentInput.trim() === '') return;
        try {
            const originalExpr = currentInput;
            const result = evaluateExpression(currentInput);
            const resultStr = result.toString();
            historySpan.textContent = originalExpr + ' =';
            currentInput = resultStr;
            lastResult = resultStr;
            justEvaluated = true;
            errorFlag = false;
            updateDisplayUI();
        } catch (err) {
            display.value = 'Error';
            historySpan.textContent = '⚠️ Error';
            errorFlag = true;
            currentInput = '';
            lastResult = '';
            justEvaluated = false;
        }
    }
    
    // Delete last character
    function deleteLast() {
        if (errorFlag) {
            resetAll();
            return;
        }
        if (justEvaluated) {
            resetAll();
            return;
        }
        currentInput = currentInput.slice(0, -1);
        updateDisplayUI();
        if (currentInput === '') {
            historySpan.textContent = '✨ ready';
        } else {
            historySpan.textContent = currentInput;
        }
    }
    
    // Check if last char is operator
    function isLastCharOperator() {
        const ops = ['+', '-', '*', '/', '÷', '×', '%'];
        return ops.includes(currentInput.slice(-1));
    }
    
    // Check for duplicate decimal in current number
    function hasDuplicateDecimal() {
        const ops = ['+', '-', '*', '/', '÷', '×', '%'];
        let lastNum = '';
        for (let i = currentInput.length - 1; i >= 0; i--) {
            if (ops.includes(currentInput[i])) break;
            lastNum = currentInput[i] + lastNum;
        }
        return lastNum.includes('.');
    }
    
    // Main handler
    function handleInput(value) {
        // Error recovery
        if (errorFlag) {
            if (value === 'CE' || value === 'DEL') {
                resetAll();
                if (value === 'DEL') return;
            } else if (!isNaN(value) || value === '.' || ['+', '-', '*', '/', '%'].includes(value)) {
                resetAll();
            } else {
                return;
            }
        }
        
        // CE
        if (value === 'CE') {
            resetAll();
            return;
        }
        
        // DEL
        if (value === 'DEL') {
            deleteLast();
            return;
        }
        
        // EQUALS
        if (value === '=') {
            computeResult();
            return;
        }
        
        // After equals: number or decimal starts fresh
        if (justEvaluated === true) {
            if (/[0-9.]/.test(value)) {
                currentInput = '';
                justEvaluated = false;
                lastResult = '';
                historySpan.textContent = '';
            } else if (['+', '-', '*', '/', '%'].includes(value)) {
                currentInput = lastResult + value;
                justEvaluated = false;
                updateDisplayUI();
                historySpan.textContent = currentInput;
                return;
            } else {
                justEvaluated = false;
            }
        }
        
        // Prevent consecutive operators
        const operators = ['+', '-', '*', '/', '÷', '×', '%'];
        if (operators.includes(value) && isLastCharOperator()) {
            currentInput = currentInput.slice(0, -1) + value;
            updateDisplayUI();
            historySpan.textContent = currentInput;
            return;
        }
        
        // Decimal handling
        if (value === '.') {
            if (hasDuplicateDecimal()) return;
            if (currentInput === '' || isLastCharOperator()) {
                currentInput = currentInput + '0.';
                updateDisplayUI();
                historySpan.textContent = currentInput;
                return;
            }
            currentInput = currentInput + '.';
            updateDisplayUI();
            historySpan.textContent = currentInput;
            return;
        }
        
        // Percentage
        if (value === '%') {
            if (currentInput === '') return;
            currentInput = currentInput + '%';
            updateDisplayUI();
            historySpan.textContent = currentInput;
            return;
        }
        
        // Numbers and operators
        let mappedValue = value;
        if (value === '÷') mappedValue = '/';
        if (value === '×') mappedValue = '*';
        if (value === '−') mappedValue = '-';
        
        // Handle zero leading
        if (currentInput === '0' && !isNaN(value) && value !== '0') {
            currentInput = value;
        } else if (currentInput === '0' && value === '0') {
            return;
        } else {
            currentInput = currentInput + mappedValue;
        }
        
        updateDisplayUI();
        if (currentInput !== '') {
            historySpan.textContent = currentInput;
        } else {
            historySpan.textContent = '✨ ready';
        }
        
        if (justEvaluated) justEvaluated = false;
    }
    
    // Event listeners
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = btn.getAttribute('data-value');
            if (val) handleInput(val);
        });
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        const controlKeys = ['Enter', '=', 'Backspace', 'Escape', '*', '/', '+', '-', '%', '.'];
        if (controlKeys.includes(key) || (key >= '0' && key <= '9')) {
            e.preventDefault();
        }
        
        if (key >= '0' && key <= '9') handleInput(key);
        else if (key === '.') handleInput('.');
        else if (key === '+') handleInput('+');
        else if (key === '-') handleInput('-');
        else if (key === '*') handleInput('*');
        else if (key === '/') handleInput('/');
        else if (key === '%') handleInput('%');
        else if (key === 'Enter' || key === '=') handleInput('=');
        else if (key === 'Backspace') handleInput('DEL');
        else if (key === 'Escape') handleInput('CE');
    });
    
    // Initialize
    resetAll();
    document.body.setAttribute('tabindex', '0');
    document.body.focus();
})();
