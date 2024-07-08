import { counters, setupValues, initializeLevel } from "./helpers.js";

// Object with the details for every level
    // Used for determining the next level type for navigation to the next level
    // Also used for the passScore of each review level
const levelProgression = {
    1: {"levelType": "tutorial"},
    2: {"levelType": "tutorial"},
    3: {"levelType": "review", "passScore": 50},
    4: {"levelType": "tutorial"},
    5: {"levelType": "review", "passScore": 50},
    6: {"levelType": "review", "passScore": 50},
    7: {"levelType": "tutorial"},
    8: {"levelType": "review", "passScore": 50},
    9: {"levelType": "review", "passScore": 50},
    10: {"levelType": "tutorial"},
    11: {"levelType": "review", "passScore": 50},
    12: {"levelType": "review", "passScore": 50},
    13: {"levelType": "tutorial"},
    14: {"levelType": "review", "passScore": 50},
    15: {"levelType": "review", "passScore": 50},
    16: {"levelType": "review", "passScore": 50},
    17: {"levelType": "review", "passScore": 50}
}

//  Gets setup values
const { paragraph, isReviewLevel, isTutorialLevel, currentLevel } = setupValues();

document.addEventListener("DOMContentLoaded", () => {
    // This renders the characters on the page and applies correct functionality depending on the type of level
    // function is defined in helpers.js
    initializeLevel(paragraph, isTutorialLevel, counters);

    // Checks if the user has finished the level
    document.addEventListener("keydown", () => {
        if (counters.currentIndex >= paragraph.length) {
            levelCompleted(isTutorialLevel, isReviewLevel, currentLevel)
        }
    }) 
});

function levelCompleted(isTutorialLevel, isReviewLevel, currentLevel) {
    // Initializes the score and passScore so they can be passed into the updateHighestLevelCompleted parameters at the end 
    let score = 0;
    let passScore = 0;

    if (isTutorialLevel) {
        showTutorialModal();

        const tutorialNextLevel = document.getElementById("tutorialNextLevel"); 
        tutorialNextLevel.addEventListener("click", () => nextLevel(currentLevel, levelProgression));
    }
    else if (isReviewLevel) {
        const results = calculateResults(currentLevel, counters, levelProgression);

        // Updates score and passScore values to pe passed into updateHighestLevelCompleted
        score = results.score;
        passScore = results.passScore;

        // Calls showReviewModal function (shows the review modal)
        showReviewModal(results);

        // Event listeners for next level & retry buttons
        const reviewNextLevel = document.getElementById("reviewNextLevel");
            reviewNextLevel.addEventListener("click", () => nextLevel(currentLevel, levelProgression));

        const retryButton = document.getElementById("retryLevel");
        retryButton.addEventListener("click", () => location.reload());
    }
    else {
        // TODO
        console.log("isn't a review level")
    }
    
    // Updates the highest level completed in db 
    updateHighestLevelCompleted(score, passScore, isTutorialLevel);
}

// Displays the tutorial modal
function showTutorialModal() {
    const tutorialModal = document.getElementById("tutorialResultsModal");
    const nextLevelButton = document.getElementById("tutorialNextLevel");

    tutorialModal.style.display = "block";
    nextLevelButton.style.display = "inline-block";
}

function calculateResults(currentLevel, counters, levelProgression) {
    // Records the time of when user finishes the level
    counters.endTime = new Date();

    // Defines correct and incorrect count to be used in results object
    const correctCount = counters.correctCount;
    const incorrectCount = counters.incorrectCount;
    // Creates variables to store the total time, wpm and score
    const totalTime = (counters.endTime - counters.startTime) / 1000; // Time in seconds
    const totalWords = (correctCount + incorrectCount) / 5; // Average word length of 5 characters
    const wpm = (totalWords) / (totalTime / 60)

    // Accuracy calculation
    const totalAttempts = correctCount + incorrectCount + counters.backspaceCount;
    const accuracy = Math.floor((correctCount / totalAttempts) * 100);

    // Score calculations
    const weightWpm = 0.4;
    const weightAccuracy = 0.6;
    const score = Math.floor((weightAccuracy * accuracy) + (weightWpm * wpm))  // Score they get to pass the level
    const passScore = levelProgression[currentLevel].passScore // Score they have to beat to pass the level (from object)

    // Creates object to store all the data that will be displayed on screen & sent to the server-side
    const results = {
        correctCount,
        incorrectCount,
        totalTime,
        wpm,
        accuracy,
        score,
        passScore
    }
    return results
        
}

// Displays the review results modal and sends the results to the server where they are stored in the db
function showReviewModal(results) {
    const resultsModal = document.getElementById("reviewResultsModal");

    document.getElementById("correctCount").textContent = `Correct: ${results.correctCount}`;
    document.getElementById("incorrectCount").textContent = `Incorrect: ${results.incorrectCount}`;
    document.getElementById("totalTime").textContent = `Time: ${results.totalTime.toFixed(2)} seconds`;
    document.getElementById("wpm").textContent = `WPM: ${results.wpm.toFixed(2)}`;
    document.getElementById("accuracy").textContent = `Accuracy: ${results.accuracy}%`;
    document.getElementById("score").textContent = `Score: ${results.score}`;

    resultsModal.style.display = "block";

    toggleButtons(results.score, results.passScore);
    sendResults(results);
}


function sendResults(results) {
    try {
        // Sends the results object in JSON format to review-results endpoint
        fetch("/review-results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(results)
        })
    } 
    catch (error) {
        console.error("Error: failed to send results", error);
    }
}

function updateHighestLevelCompleted(score, passScore, isTutorialLevel) {
    // Calls complete-level route (updates the highest_level_completed in db)
        fetch("/complete-level", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                score: score,
                passScore: passScore,
                isTutorial: isTutorialLevel
            })
        })
        .catch(error => {
            console.error("Error: failed to call complete-level route", error);
        });
}


// Navigates to the next level
function nextLevel(currentLevel, levelProgression) {
    const lastLevel = Object.keys(levelProgression).length;

    if (currentLevel === lastLevel) {
        return window.location.href = "/congratulations";
    }
    else if (levelProgression[currentLevel + 1]) {
        const nextLevelType = levelProgression[currentLevel + 1].levelType;
        const nextLevelNumber = currentLevel +1;

        return window.location.href = `/levels/${nextLevelType}/${nextLevelNumber}`;
    }
    else {
        console.error("Error: Invalid level or missing data in levelProgression");
    }  
}


// Shows corresponding button if user passes or fails the level
function toggleButtons(score, passScore) {
    const nextLevelButton = document.getElementById("reviewNextLevel");

    score > passScore ? nextLevelButton.style.display = "inline-block" 
    : nextLevelButton.style.display = "none";
}  
