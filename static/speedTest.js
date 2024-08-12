import { counters, setupValues, initializeLevel } from "./helpers.js";

//  Gets setup values
const { paragraph, isTutorialLevel } = setupValues();

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
    const results = calculateResults(counters)

    // Calls showReviewModal function (shows the review modal)
    showSpeedTestModal(results);

    // Event listeners for next level, retry & home buttons
    const nextTest = document.getElementById("nextTest");
    nextTest.addEventListener("click", () => window.location.href = "/next-speed-test");

    const returnHome = document.getElementById("modalReturnHome");
    returnHome.addEventListener("click", () => window.location.href = "/");

    const retryButton = document.getElementById("retryLevel");
    retryButton.addEventListener("click", () => location.reload());
}


function calculateResults(counters) {
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

    // Creates object to store all the data that will be displayed on screen & sent to the server-side
    const results = {
        correctCount,
        incorrectCount,
        totalTime,
        wpm,
        accuracy
    }
    return results;
}


function showSpeedTestModal(results) {
    const speedTestModal = document.getElementById("speedTestModal");

    document.getElementById("correctCount").textContent = `Correct: ${results.correctCount}`;
    document.getElementById("incorrectCount").textContent = `Incorrect: ${results.incorrectCount}`;
    document.getElementById("totalTime").textContent = `Time: ${results.totalTime.toFixed(2)}s`;
    document.getElementById("wpm").textContent = `WPM: ${results.wpm.toFixed(2)}`;
    document.getElementById("accuracy").textContent = `Accuracy: ${results.accuracy}%`;

    speedTestModal.style.display = "block";

    sendResults(results);
}

function sendResults(results) {
    try {
        // Sends the results object in JSON format to review-results endpoint
        fetch("/speed-test-results", {
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

