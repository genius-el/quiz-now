'use strict';

// DOM ELEMENT REFERENCES
// Screen References
const screen1 = document.querySelector('.screen-1');
const screen2 = document.querySelector('.screen-2');
const screen3 = document.querySelector('.screen-3');

const categories = document.querySelectorAll('.category');
const categoryDisplay = document.getElementById('category-display');
const questionNumber = document.getElementById('question-number');
const timer = document.getElementById('timer');
const scoreDisplay = document.getElementById('score-display');
const questionText = document.getElementById('question-text');
const options = document.querySelectorAll('[data-answer]');
const optionTexts = document.querySelectorAll('.option-text');
const resultCategory = document.getElementById('result-category');
const finalScore = document.getElementById('final-score');
const performanceMessage = document.getElementById('performance-message');
const correctAnswerScore = document.getElementById('correct-answers');
const wrongAnswerScore = document.getElementById('wrong-answers');


// Button References
const startBtn = document.getElementById('start-btn');
const checkBtn = document.getElementById('check-btn');
const playAgainBtn = document.getElementById('play-again-btn');

// STATE VARIABLES
let selectedCategory;
let questionsArray;
let currentQuestionIndex = 0;
let currentScore = 0;
let currentSelectedOption;
let correctCount = 0;
let wrongCount = 0;

let timerInterval; //storing the setInterval reference
let timeLeft; // the actual countdown timer

const categoryMap = {
    science: 17,
    technology: 18,
    history: 23,
    music: 12,
    sports: 21,
    art: 25,
    politics: 24,
    'general-knowledge': 9,
    film: 11,
}

// CATEGORY SELECTION
categories.forEach((category) => {
    category.addEventListener('click', function() {
        categories.forEach((cat) => {
            cat.classList.remove('selected');
        })
        category.classList.add('selected');
        // DON'T LET 'category.dataset.category' CONFUSE YOU. The first category is the name of the variable in the HTML element that we want to access (data-category), and the second category is just part of the syntax for accessing data attributes in JavaScript. The value of 'category.dataset.category' is whatever is stored in the data-category attribute of the HTML element that was clicked on.
        selectedCategory = category.dataset.category;
    })
})

// START QUIZ FUNCTIONALITY

// Using the async function to make the API call and get the questions
async function getQuestions(url) {

    try {
        // 1. Await the fetch call to get the response object
        const response = await fetch(url);

        // 2. Check if the response was successful (status 200 - 299)
        if (!response.ok) {
            const message = `An error occurred: ${response.status}`;
            throw new Error(message);
        }

        // 3. Await the response parsing (e.g., as JSON) to get the final data
        const data = await response.json();

        // 4. Use the data
        return data;
    } catch (error) {
        // Handle network errors or the error thrown manually above
        console.error("Fetch failed:", error)
    }
}

// Start Button Event Listener
// Adding async to the function declaration because it relies on data that is contained in the above async function getQuestions(). We need to await the data from getQuestions() before we can proceed with populating the questionsArray and displaying the first question.
startBtn.addEventListener('click', async function () {
    // Constructing the API URL with the selected category
    let url = `https://opentdb.com/api.php?amount=10&category=${categoryMap[selectedCategory]}&type=multiple`;
    // Validating that category was selected
    if (selectedCategory) {
        // Change screens
        screen1.classList.add('hidden');
        screen2.classList.remove('hidden');

        // Questions Array gets populated
        let questionsObject = await getQuestions(url); 
        questionsArray = questionsObject.results;
        console.log(questionsArray);

        displayQuestion();

    }
    
})

// DECODING HTML ENTITIES FUNCTIONALITY
const decodeHTML = function(text) {
    const temp = document.createElement('textarea');
    temp.innerHTML = text;
    return temp.value;
}

// function declaration is used here instead of function expression to avoid hoisting issues with the async function above where displayQuestion is called before its definition.
function displayQuestion() {
    // Get the current question
    let fullQuestionElement = questionsArray[currentQuestionIndex];

    // Decoding the HTML entities in the full question (question and options)
    let decodedQuestion = decodeHTML(fullQuestionElement.question);

    // Update question text
    let questionWords = decodedQuestion;
    questionText.textContent = questionWords;

    // Combine and reshuffle answers
    let optionsPool = [];
    optionsPool = [fullQuestionElement.correct_answer].concat(fullQuestionElement.incorrect_answers);
    optionsPool.sort(() => Math.random() - 0.5);


    // Display each answer in the four option divs
    for (let i = 0; i < optionsPool.length; i++) {
        optionTexts[i].textContent = optionsPool[i];
    }

    // Update question number display
    questionNumber.textContent = `${currentQuestionIndex + 1}/10`;

    // Update category display
    categoryDisplay.textContent = selectedCategory;

    

    // SETTING TIMER FUNCTIONALITY
    // Clearing any existing timer
    clearInterval(timerInterval);

    timeLeft = 30;
    timerInterval = setInterval(function() {
        timeLeft--;
        timer.textContent = `${timeLeft}s`

        if (timeLeft === 0) {
            clearInterval(timerInterval);
            // At the very instant that time runs out, we want to ensure that all options are unselected when the next question appears.
            options.forEach((option) => {
                option.classList.remove('selected');
            })
            moveToNextQuestion();
        }
    }, 1000);

    // Cleaning up all 'correct' and 'wrong' class additions from previous question display
    options.forEach((opt) => {
        opt.classList.remove('correct', 'wrong', 'selected');
    })
}

// MOVE TO NEXT QUESTION FUNCTIONALITY
function moveToNextQuestion () {
    // Setting correct answer in a variable for easy access in the score increase condition below. This is the correct answer for the question that was just displayed and answered (or timed out on).
    const correctAnswer = questionsArray[currentQuestionIndex].correct_answer;

    // Condition for score increase upon move to next question. This is placed here because we want the score to increase regardless of whether the user clicks the check button or lets the timer run out. This also prevents any potential bugs where a user could click check multiple times to increase their score unfairly.
    if (currentSelectedOption === correctAnswer) {
        currentScore++;
        correctCount++;
    } else {
        wrongCount++;
    }
    // Showing score display
    scoreDisplay.textContent = `${currentScore}/10`;

    // Resetting current selected option
    currentSelectedOption = null;

    // ===================== THIS IS ACTUALLY WHAT INITIATES THE MOVE TO NEXT QUESTION =======================
    // Updating question index for the next question
    currentQuestionIndex++;

    if (currentQuestionIndex < 10) {
        displayQuestion();
    } else {
        setTimeout(function() {
            showResults();
        }, 1500);
    }
}

// OPTION CLICK FUNCTIONALITY
// For receiving and storing current selected option
options.forEach((option) => {
    option.addEventListener('click', function () {
        options.forEach((option) => {
            option.classList.remove('selected');
        })
        option.classList.add('selected');
        // Storing the selected answer(option) in the currentSelectedOption state variable: This is represent in code what has been selected.
        currentSelectedOption = option.querySelector('.option-text').textContent;
    })
})

// Check Button Functionality
checkBtn.addEventListener('click', function () {
    // Adding a guard for if the user selects no options but clicks check button
    if (!currentSelectedOption) return;
    // Stop timer immediately
    clearInterval(timerInterval);
    const correctAnswer = questionsArray[currentQuestionIndex].correct_answer;

    // REMOVED THE SCORE INCREASE CONDITION FROM HERE AND MOVED IT TO THE moveToNextQuestion FUNCTION BECAUSE WE WANT THE SCORE TO INCREASE REGARDLESS OF WHETHER THE USER CHECKS THEIR ANSWER OR LETS THE TIMER RUN OUT. THIS ALSO PREVENTS ANY POTENTIAL BUGS WHERE A USER COULD CLICK CHECK MULTIPLE TIMES TO INCREASE THEIR SCORE UNFAIRLY.
    // Condition for score increase
    // if (currentSelectedOption === correctAnswer) {
    //     currentScore++;
    // }

    // Remove 'selected' class from all options
    options.forEach((opt) => opt.classList.remove('selected'));

    // Loop to apply correct/wrong answer
    options.forEach((option) => {
        const optionText = option.querySelector('.option-text').textContent;

        // setting correct option 
        if (optionText === correctAnswer) {
            option.classList.add('correct');
        }

        // Checking if option in loop is what user selected AND if it is also the correct answer
        if (optionText === currentSelectedOption && optionText !== correctAnswer) {
            option.classList.add('wrong');
        }
    })
    
    // Brief wait period for user to see the correct/wrong answer feedback
    setTimeout(function() {
        moveToNextQuestion();
    }, 1500);
    
})

// SHOW RESULTS FUNCTIONALITY

let quizMessages = {
    0: `It seems you didn't get any correct answers this time. Try again and see if you can improve your score!`,

    1: `You’ve made a start and that matters. You’re not there yet, but each try builds your knowledge. Jump back in and keep going.`,

    2: `Good progress. You’re getting the hang of it, just not there yet. Another run will sharpen things up.`,

    3: `You’re very close. Just a small gap left to close. Go again and lock it in.`,

    4: `You got it right. Strong work. Try again with a new set and see if you can keep the streak going.`,
}

function showResults () {
    // Switch to results screen
    screen2.classList.add('hidden');
    screen3.classList.remove('hidden');
    
    // Show category that was played
    resultCategory.textContent = selectedCategory;

    // Show final score
    finalScore.textContent = currentScore;

    // Display correct and wrong answer counts
    correctAnswerScore.textContent = correctCount;
    wrongAnswerScore.textContent = wrongCount;

    // Displaying performance message based on score range.
    if (currentScore >= 1 && currentScore <= 4) {
        performanceMessage.textContent = quizMessages[1];
    } else if (currentScore >= 5 && currentScore <= 7) {
        performanceMessage.textContent = quizMessages[2];
    } else if (currentScore >= 8 && currentScore <= 9) {
        performanceMessage.textContent = quizMessages[3];
    } else if (currentScore === 10) {
        performanceMessage.textContent = quizMessages[4];
    } else {
        performanceMessage.textContent = quizMessages[0];
    }
}

// PLAY AGAIN FUNCTIONALITY
playAgainBtn.addEventListener('click', function () {
    // Resetting state variables
    selectedCategory = null;
    questionsArray = null;
    currentQuestionIndex = 0;
    currentScore = 0;
    currentSelectedOption = null;
    correctCount = 0;
    wrongCount = 0;

    timerInterval = null; //storing the setInterval reference
    timeLeft = 30; // the actual countdown timer

    // Resetting screens back to start (Screen1)
    screen3.classList.add('hidden');
    screen1.classList.remove('hidden');

    // Resetting category selection
    categories.forEach((category) => {
        category.classList.remove('selected');
    })
})