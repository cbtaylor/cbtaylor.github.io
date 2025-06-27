let correctDisplay = document.getElementById("correct");
let number = document.getElementById("number");
let digits = document.getElementById("digits");
let numcorrect = document.getElementById("numcorrect");
let numincorrect = document.getElementById("numincorrect");
let digit = 1;
digits.textContent = digit.toString().concat("-back");
let answer = -1;
let scoreCorrect = 0;
let scoreIncorrect = 0;
let check = true;
let start = false;

function checkNum(n) {
    if (!check) {
        if (n == answer) {
            correctDisplay.textContent = "Correct";
            scoreCorrect++;
            numcorrect.textContent = scoreCorrect;

        } else {
            correctDisplay.textContent = "Incorrect";
            scoreIncorrect++;
            numincorrect.textContent = scoreIncorrect;

        }
        start = false;
        check = true;
    }
}

function countdown() {
    if (!start) {
        start = true;
        correctDisplay.textContent = '';
        var count = 8 + Math.floor(Math.random() * 7);
        const randomIntArray = (n = 1) =>
            Array.from({
                    length: n
                },
                () => Math.floor(Math.random() * 10)
            );
        let numbers = randomIntArray(count+1);
        answer = numbers[digit - 1];
        var timer = setInterval(function() {
            if (count >= 0) {
                number.innerHTML = numbers[count];
                number.style.opacity = 1;
                setTimeout(fadeout, 500);
                count--;
            } else {
                clearInterval(timer);
                check = false;
            }
        }, 1000);
    }
}

function set_n(n) {
    digit = n;
    digits.textContent = n.toString().concat("-back");
}

function fadeout() {
    number.style.opacity = '0';
}
