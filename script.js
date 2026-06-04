/**
 * Calculator Pro - Premium Edition
 * Features: Smart evaluation, keyboard support, percentage, history display
 * Author: Custom implementation
 */

// DOM Elements
const display = document.getElementById('display');
const historyExprSpan = document.getElementById('historyExpr');

// Calculator State
let currentInput = '';      // Current expression or number shown on display
let lastResult = '';         // Stores last computed result
let justCalculated = false;  // Flag to know if last action was '=' (for fresh start)
let errorState = false;      // Flag to track error state

// Helper: Update the display input field
function updateDisplay() {
    if (currentInput === '') {
        display.value = '';
        display.placeholder = '0';
    } else {
        display.value = currentInput;
        display.placeholder = '';
    }
}

// Helper: Update history panel
function updateHistory(content) {
    if (content === undefined) {
        if (currentInput !== '' && !justCalculated) {
            historyExprSpan.textContent = currentInput;
        } else if (currentInput === '' && !errorState) {
            historyExprSpan.textContent = '✨ ready';
        } else if (errorState) {
            // keep error message or show ready
            if (historyExprSpan.textContent === '⚠️ Error') return;
        }
    } else {
        historyExprSpan.textContent = content;
    }
}

// Helper: Clear everything (CE)
function clearAll() {
    currentInput = '';
    lastResult = '';
    justCalculated = false;
    errorState = false;
    updateDisplay();
    historyExprSpan.textContent = '✨ ready';
}

// Helper: Delete last character (DEL)
function deleteLast() {
    if (errorState) {
        clearAll();
        return;
    }
    if (justCalculated) {
        // After equals, pressing DEL resets everything
        clearAll();
        return;
    }
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
    if (currentInput === '') {
        historyExprSpan.textContent = '✨ ready';
    } else {
        historyExprSpan.textContent = currentInput;
    }
}

// Helper: Evaluate expression safely
function evaluateExpression(expression) {
    // Replace visual operators with JS operators
    let sanitized = expression.replace(/÷/g, '/').replace(/×/g, '*');
    
    // Handle percentage: convert patterns like "50%" to "(50/100)"
    // Supports: 50% + 20, 30%*200, etc.
    // Regex matches numbers (including decimals) followed by % not preceded by another % 
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => {
        return `(${num}/100)`;
    });
    
    // Also handle cases like .5% (leading decimal)
    sanitized = sanitized.replace(/(\.\d+)%/g, (match, num) => {
        return `(${num}/100)`;
    });
    
    // Prevent empty expression
    if (sanitized.trim() === '') throw new Error('Empty expression');
    
    // Use Function constructor for safer evaluation (still eval-like but scoped)
    // It returns the result of the arithmetic expression
    const resultFn = new Function(`'use strict'; return (${sanitized})`);
    let result = resultFn();
    
    // Handle invalid results
    if (!isFinite(result) || isNaN(result)) {
        throw new Error('Invalid calculation');
    }
    
    // Fix floating point precision (e.g., 0.1 + 0.2)
    result = parseFloat(result.toFixed(10));
    
    // Remove trailing .0 for better display (if it's integer)
    if (Math.abs(result - Math.round(result)) < 1e-12) {
        result = Math.round(result);
    }
    
    return result;
}

// Main calculation on '='
function calculateResult() {
    if (errorState) {
        clearAll();
        return;
    }
    
    if (currentInput.trim() === '') {
        return;
    }
    
    try {
        // Store original expression for history
        const originalExpr = currentInput;
        const result = evaluateExpression(currentInput);
        const resultStr = result.toString();
        
        // Update history: show expression + "="
        historyExprSpan.textContent = originalExpr + ' =';
        
        // Set new state
        currentInput = resultStr;
        lastResult = resultStr;
        justCalculated = true;
        errorState = false;
        updateDisplay();
    } catch (err) {
        // Error state
        display.value = 'Error';
        display.placeholder = '';
        historyExprSpan.textContent = '⚠️ Error';
        errorState = true;
        currentInput = '';
        lastResult = '';
        justCalculated = false;
    }
}

// Helper: Check and prevent multiple decimals in the current number
function hasMultipleDecimal(currentStr) {
    // Split by operators to get the last number segment
    const operators = ['+', '-', '*', '/', '÷', '×', '%'];
    let lastNumber = '';
    for (let i = currentStr.length - 1; i >= 0; i--) {
        const ch = currentStr[i];
        if (operators.includes(ch)) break;
        lastNumber = ch + lastNumber;
    }
    return lastNumber.includes('.');
}

// Helper: Prevent multiple leading zeros pattern (optional)
function sanitizeNumberInput(value, current) {
    // If current is empty and value is '0', allow single zero
    if (current === '' && value === '0') {
        return '0';
    }
    // Prevent multiple zeros at start like "00" -> "0"
    if (current === '0' && value === '0') {
        return '0';
    }
    // If current is exactly "0" and value is a digit (1-9) replace
    if (current === '0' && value !== '.' && !isNaN(value) && value !== '0') {
        return value;
    }
    return current + value;
}

// Core handler for all inputs (buttons & keyboard)
function handleInput(value) {
    // If in error state, any clear action or number resets
    if (errorState) {
        if (value === 'CE' || value === 'DEL') {
            clearAll();
            if (value === 'DEL') return;
        } else if (!isNaN(value) || value === '.' || value === '+' || value === '-' || value === '*' || value === '/' || value === '%') {
            clearAll();
            // After clear, we continue processing the new value
        } else {
            return;
        }
    }
    
    // CE: Clear everything
    if (value === 'CE') {
        clearAll();
        return;
    }
    
    // DEL: Delete last character
    if (value === 'DEL') {
        deleteLast();
        return;
    }
    
    // EQUALS: Calculate result
    if (value === '=') {
        calculateResult();
        return;
    }
    
    // ========== Handle fresh start after '=' ==========
    // If we just calculated something and user presses a number or dot, start fresh expression
    if (justCalculated === true) {
        // If input is a number or decimal point -> new expression
        if (/[0-9.]/.test(value)) {
            currentInput = '';
            justCalculated = false;
            lastResult = '';
            historyExprSpan.textContent = '';
        } 
        // If user presses an operator after result (e.g., 5 + ), chain calculation
        else if (['+', '-', '*', '/', '%'].includes(value)) {
            // Use lastResult as first operand
            currentInput = lastResult + value;
            justCalculated = false;
            updateDisplay();
            historyExprSpan.textContent = currentInput;
            return;
        }
        else {
            // Any other key resets but handle regularly
            if (value !== 'CE' && value !== 'DEL') {
                justCalculated = false;
            }
        }
    }
    
    // ========== Prevent duplicate operators ==========
    const lastChar = currentInput.slice(-1);
    const operators = ['+', '-', '*', '/', '÷', '×', '%'];
    const isOperator = (ch) => operators.includes(ch);
    
    if (isOperator(value) && isOperator(lastChar)) {
        // Replace the last operator with new one
        currentInput = currentInput.slice(0, -1) + value;
        updateDisplay();
        historyExprSpan.textContent = currentInput;
        return;
    }
    
    // ========== Handle Decimal Point (.) ==========
    if (value === '.') {
        // Prevent multiple decimals in the same number
        if (hasMultipleDecimal(currentInput)) {
            return;
        }
        // If current input is empty or starts with operator, add '0.'
        if (currentInput === '' || isOperator(lastChar)) {
            currentInput = currentInput + '0.';
            updateDisplay();
            historyExprSpan.textContent = currentInput;
            return;
        }
        // Normal decimal addition
        currentInput = currentInput + '.';
        updateDisplay();
        historyExprSpan.textContent = currentInput;
        return;
    }
    
    // ========== Handle Percentage sign specially ==========
    if (value === '%') {
        if (currentInput === '') return;
        // Append % symbol at the end
        currentInput = currentInput + '%';
        updateDisplay();
        historyExprSpan.textContent = currentInput;
        return;
    }
    
    // ========== Handle Numbers & other operators ==========
    // Prevent multiple leading zeros logic for numbers
    let newInput = '';
    if (value >= '0' && value <= '9') {
        // Edge: if currentInput is exactly "0" and user types another digit (like 0 then 5), replace
        if (currentInput === '0') {
            newInput = value;
        } else {
            newInput = currentInput + value;
        }
    } else {
        // operators: + - * / (including visual × and ÷)
        let mappedValue = value;
        if (value === '÷') mappedValue = '/';
        if (value === '×') mappedValue = '*';
        if (value === '−') mappedValue = '-';
        newInput = currentInput + mappedValue;
    }
    
    // Special case: handling "0" already covered
    if (currentInput === '0' && value !== '.' && /[1-9]/.test(value)) {
        currentInput = value;
    } else {
        currentInput = newInput;
    }
    
    // Update UI and history
    updateDisplay();
    if (currentInput !== '') {
        historyExprSpan.textContent = currentInput;
    } else {
        historyExprSpan.textContent = '✨ ready';
    }
    
    // Reset justCalculated flag for any ongoing typing
    if (justCalculated) justCalculated = false;
}

// ========== ATTACH EVENT LISTENERS ==========
// Select all buttons and add click handlers
const buttons = document.querySelectorAll('.btn');
buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const rawValue = btn.getAttribute('data-value');
        if (rawValue) {
            // Map display symbols to actual values if needed (but data-value already correct)
            handleInput(rawValue);
        }
    });
});

// ========== KEYBOARD SUPPORT (Full) ==========
document.addEventListener('keydown', (e) => {
    const key = e.key;
    // Prevent default actions for calculator keys
    const controlKeys = ['Enter', '=', 'Backspace', 'Escape', '*', '/', '+', '-', '%', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (controlKeys.includes(key) || (key >= '0' && key <= '9')) {
        e.preventDefault();
    }
    
    // Numbers
    if (key >= '0' && key <= '9') {
        handleInput(key);
    }
    // Decimal
    else if (key === '.') {
        handleInput('.');
    }
    // Operators
    else if (key === '+') {
        handleInput('+');
    }
    else if (key === '-') {
        handleInput('-');
    }
    else if (key === '*') {
        handleInput('*');
    }
    else if (key === '/') {
        handleInput('/');
    }
    else if (key === '%') {
        handleInput('%');
    }
    // Enter or = for evaluation
    else if (key === 'Enter' || key === '=') {
        handleInput('=');
    }
    // Backspace for DEL
    else if (key === 'Backspace') {
        handleInput('DEL');
    }
    // Escape for CE (Clear Everything)
    else if (key === 'Escape') {
        handleInput('CE');
    }
});

// Initial setup
clearAll();

// Additional small fix: Make sure after error state typing numbers clears properly
// Also handle expressions that start with operator (auto prefix 0)
// Graceful error boundaries: avoid double evaluation triggers
window.addEventListener('load', () => {
    // Focus body to capture keyboard immediately
    document.body.setAttribute('tabindex', '0');
    document.body.focus();
    // little style
    console.log('Calculator Pro Ready — premium experience');
});
