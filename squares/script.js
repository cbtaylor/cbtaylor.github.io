let currentNumber;
let correctAnswer;

// Generate a random number less than 50
function generateRandomNumber() {
    currentNumber = Math.floor(Math.random() * 50);
    correctAnswer = currentNumber * currentNumber;
    document.getElementById('number-display').textContent = currentNumber;
}

// Add a number to the input field
function addNumber(number) {
    const input = document.getElementById('answer-input');
    input.value += number;
}

// Clear the input field
function clearInput() {
    document.getElementById('answer-input').value = '';
}

// Submit the answer and check if it's correct
function submitAnswer() {
    const userAnswer = parseInt(document.getElementById('answer-input').value, 10);
    const resultMessage = document.getElementById('result-message');

    if (userAnswer === correctAnswer) {
        resultMessage.textContent = 'Correct! Well done!';
        resultMessage.style.color = 'green';
    } else {
        resultMessage.textContent = `Incorrect. The correct answer is ${correctAnswer}.`;
        resultMessage.style.color = 'red';
    }

    // Clear input and generate a new number
    clearInput();
    generateRandomNumber();
}

// Initialize the quiz
window.onload = function () {
    generateRandomNumber();
};