import { counters, setupValues, initializeLevel } from "./helpers.js";

//  Gets setup values
const { paragraph, isReviewLevel, isTutorialLevel, currentLevel } = setupValues();

document.addEventListener("DOMContentLoaded", () => {
    // This renders the characters on the page and applies correct functionality depending on the type of level
    // function is defined in helpers.js
    initializeLevel(paragraph, isTutorialLevel, counters);

    // Checks if the user has finished the level
    document.addEventListener("keydown", () => {
        if (counters.currentIndex >= paragraph.length) {
            speedTestCompleted(counters)
        }
    }) 
});

function speedTestCompleted(counters) { 
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

    // Calls showReviewModal function (shows the review modal)
    showSpeedTestModal(correctCount, incorrectCount, totalTime, wpm, accuracy);

    // Event listeners for next level & retry buttons #TODO
    const nextTest = document.getElementById("nextTest");
        nextTest.addEventListener("click", () => location.reload());

    const retryButton = document.getElementById("retryLevel");
    retryButton.addEventListener("click", );
}

function showSpeedTestModal(correctCount, incorrectCount, totalTime, wpm, accuracy) {
    const speedTestModal = document.getElementById("speedTestModal");

    document.getElementById("correctCount").textContent = `Correct: ${correctCount}`;
    document.getElementById("incorrectCount").textContent = `Incorrect: ${incorrectCount}`;
    document.getElementById("totalTime").textContent = `Time: ${totalTime.toFixed(2)} seconds`;
    document.getElementById("wpm").textContent = `WPM: ${wpm.toFixed(2)}`;
    document.getElementById("accuracy").textContent = `Accuracy: ${accuracy}%`;

    speedTestModal.style.display = "block";
}

