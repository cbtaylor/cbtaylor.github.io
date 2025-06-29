    <script>
        let currentNumber;
        let correctAnswer;
        let currentDifficulty = '2digit'; // '2digit' or '3digit'

        // Set difficulty level
        function setDifficulty(difficulty) {
            currentDifficulty = difficulty;
            
            // Update button styles
            document.getElementById('two-digit-btn').classList.toggle('active', difficulty === '2digit');
            document.getElementById('three-digit-btn').classList.toggle('active', difficulty === '3digit');
            
            // Generate new number with new difficulty
            generateRandomNumber();
            clearInput();
            clearResult();
        }

        // Generate a random number based on difficulty
        function generateRandomNumber() {
            if (currentDifficulty === '2digit') {
                currentNumber = Math.floor(Math.random() * 90) + 10; // 10-99
            } else {
                currentNumber = Math.floor(Math.random() * 900) + 100; // 100-999
            }
            
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

        // Clear the result message
        function clearResult() {
            const resultMessage = document.getElementById('result-message');
            resultMessage.textContent = '';
            resultMessage.className = 'result-message';
        }

        // Submit the answer and check if it's correct
        function submitAnswer() {
            const userAnswer = parseInt(document.getElementById('answer-input').value, 10);
            const resultMessage = document.getElementById('result-message');

            if (isNaN(userAnswer)) {
                resultMessage.textContent = 'Please enter a number';
                resultMessage.className = 'result-message incorrect';
                return;
            }

            if (userAnswer === correctAnswer) {
                resultMessage.textContent = 'Correct';
                resultMessage.className = 'result-message correct';
            } else {
                resultMessage.textContent = 'Incorrect';
                resultMessage.className = 'result-message incorrect';
            }
        }

        // Generate next problem
        function nextProblem() {
            clearInput();
            clearResult();
            generateRandomNumber();
        }

        // Initialize the quiz
        window.onload = function () {
            generateRandomNumber();
        };
    </script>
