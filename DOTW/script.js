let check, year, month, day, date, daysOfWeek, dayOfWeek, generatedDateElement, dayOfWeekElement;

function generateRandomDate() {
    check = 0;
    year = Math.floor(Math.random() * (2199 - 1753 + 1) + 1753);
    month = Math.floor(Math.random() * 12) + 1;
    day = Math.floor(Math.random() * 31) + 1;
    date = new Date(year, month, day);
    daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    dayOfWeek = daysOfWeek[date.getDay()];
    generatedDateElement = document.getElementById('generated-date');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    generatedDateElement.textContent = date.toLocaleDateString(
      undefined,
      options
    );
    dayOfWeekElement = document.getElementById('day-of-week');
    dayOfWeekElement.textContent = '';
    generatedDateElement.style.display = "initial";
}

function displayDayOfWeek() {
    dayOfWeekElement.textContent = dayOfWeek;
}

function checkDay(day) {
      generatedDateElement.style.display = "initial";
      displayDayOfWeek();
      if (date.getDay() == day) {
          incrementCorrect();
      } else {
          incrementIncorrect();
      }
      check = 1;
}

function incrementCorrect() {
      if (check == 0) {
          correct++;
          correctDisplay.textContent = correct;
          check = 1;
        }
}

function incrementIncorrect() {
        if (check == 0) {
            incorrect++;
            incorrectDisplay.textContent = incorrect;
            check = 1;
        }
}

function sayAnother() {
  generateRandomDate();
  generatedDateElement.style.display = "none";
  
  // Get the button element
  const speakButton = document.getElementById('sayAnother');

  // Create a new SpeechSynthesisUtterance object
  const utterance = new SpeechSynthesisUtterance();

  // Set the text to speak
  utterance.text = `${generatedDateElement.textContent}.`;
  
  // Set the language
  utterance.lang = 'en-US';
  
  // Speak the date
  speechSynthesis.speak(utterance);

}

function reloadDate() {
    generateRandomDate();
}

generateRandomDate();
let correct = 0;
let incorrect = 0;
const correctDisplay = document.getElementById("correct");
const incorrectDisplay = document.getElementById("incorrect");
