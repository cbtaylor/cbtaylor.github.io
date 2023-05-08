var answers = [];
var answer11, answer12, answer13, answer14, answer21, answer22, answer23, answer24, answer31, answer32, answer33, answer34, answer41, answer42, answer43, answer44, answer51, answer52, answer53, answer54, question1, question2, question3, question4, question5;

var answerDisplay = [
    [0, 0, 0, 0, 0],
    [0, document.getElementById("answer11"), document.getElementById("answer12"), document.getElementById("answer13"), answer14 = document.getElementById("answer14")],
    [0, document.getElementById("answer21"), document.getElementById("answer22"), document.getElementById("answer23"), document.getElementById("answer24")],
    [0, document.getElementById("answer31"), document.getElementById("answer32"), document.getElementById("answer33"), document.getElementById("answer34")],
    [0, document.getElementById("answer41"), document.getElementById("answer42"), document.getElementById("answer43"), document.getElementById("answer44")],
    [0, document.getElementById("answer51"), document.getElementById("answer52"), document.getElementById("answer53"), document.getElementById("answer54")],
];

function checkAnswer(q, a) {
    let answer = answers[q - 1];
    if (a == answer) {
        answerDisplay[q][a].style.backgroundColor = "#baffbc";
    } else {
        answerDisplay[q][a].style.backgroundColor = "#ffd4d8";
    }
}

function fetchData() {
    fetch('https://cbtaylor.pythonanywhere.com/quiz')
        .then(response => response.json())
        .then(data => {
            document.getElementById("result").innerText = JSON.stringify(data, null, 2);
            // console.log(data);
            answers = data['answers'];

            question1 = document.getElementById("question1");
            question1.textContent = "1. " + data['Q1'];
            answer11 = document.getElementById("answer11");
            answer11.textContent = " " + data['Q1A'];
            answer12 = document.getElementById("answer12");
            answer12.textContent = " " + data['Q1B'];
            answer13 = document.getElementById("answer13");
            answer13.textContent = " " + data['Q1C'];
            answer14 = document.getElementById("answer14");
            answer14.textContent = " " + data['Q1D'];

            question2 = document.getElementById("question2");
            question2.textContent = "2. " + data['Q2'];
            answer21 = document.getElementById("answer21");
            answer21.textContent = " " + data['Q2A'];
            answer22 = document.getElementById("answer22");
            answer22.textContent = " " + data['Q2B'];
            answer23 = document.getElementById("answer23");
            answer23.textContent = " " + data['Q2C'];
            answer24 = document.getElementById("answer24");
            answer24.textContent = " " + data['Q2D'];

            question3 = document.getElementById("question3");
            question3.textContent = "3. " + data['Q3'];
            answer31 = document.getElementById("answer31");
            answer31.textContent = " " + data['Q3A'];
            answer32 = document.getElementById("answer32");
            answer32.textContent = " " + data['Q3B'];
            answer33 = document.getElementById("answer33");
            answer33.textContent = " " + data['Q3C'];
            answer34 = document.getElementById("answer34");
            answer34.textContent = " " + data['Q3D'];

            question4 = document.getElementById("question4");
            question4.textContent = "4. " + data['Q4'];
            answer41 = document.getElementById("answer41");
            answer41.textContent = " " + data['Q4A'];
            answer42 = document.getElementById("answer42");
            answer42.textContent = " " + data['Q4B'];
            answer43 = document.getElementById("answer43");
            answer43.textContent = " " + data['Q4C'];
            answer44 = document.getElementById("answer44");
            answer44.textContent = " " + data['Q4D'];

            question5 = document.getElementById("question5");
            question5.textContent = "5. " + data['Q5'];
            answer51 = document.getElementById("answer51");
            answer51.textContent = " " + data['Q5A'];
            answer52 = document.getElementById("answer52");
            answer52.textContent = " " + data['Q5B'];
            answer53 = document.getElementById("answer53");
            answer53.textContent = " " + data['Q5C'];
            answer54 = document.getElementById("answer54");
            answer54.textContent = " " + data['Q5D'];

            for (let q = 1; q <= 5; q++) {
                for (let a = 1; a <= 4; a++) {
                    answerDisplay[q][a].style.backgroundColor = "#fff";
                }
            }
        })
        .catch(error => console.error('Error:', error));
}
