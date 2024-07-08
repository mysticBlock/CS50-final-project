// This file is for the shared logic between levels.js and speedTest.js
export let counters = {
    currentIndex: 0,
    correctCount: 0,
    incorrectCount: 0,
    backspaceCount: 0,
    startTime: null,
    endTime: null
}

// Variables used throughout both levels.js and speedTest.js
export function setupValues() {
    const wordContainer = document.getElementById("wordContainer");
    const paragraph = wordContainer.getAttribute("data-paragraph");

    const page = window.location.pathname;
    const isReviewLevel = page.includes("review");
    const isTutorialLevel = page.includes("tutorial");
    const segments = page.split('/');
    const currentLevel = parseInt(segments[segments.length - 1], 10);

    return { paragraph, isReviewLevel, isTutorialLevel, currentLevel };
}

export function initializeLevel(paragraph, isTutorialLevel, counters) {
    // Renders all characters on screen in span tags
    renderChars(paragraph);

    // Logic for tutorial levels
    if (isTutorialLevel) {
        document.addEventListener("keydown", (event) => tutorialLogic(event, counters, paragraph));
    }
    // Logic for review levels and speed test
    else {
        document.addEventListener("keydown", (event) => reviewLogic(event, counters, paragraph));
    }
}

function renderChars(paragraph) {
    for (let i = 0; i < paragraph.length; i++) {
        const char = paragraph[i];
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = char === " " ? "_" : char;  // Uses a visible representation for space
        span.id = "letter-" + i;
        wordContainer.appendChild(span);
    }
}

function reviewLogic(event, counters, paragraph) {
    // Returns if caps lock or shift is pressed then listens for the next key
    if (event.key === "Shift" || event.key === "CapsLock") return;

    // Records the time from when the user hits the first key
    if (!counters.startTime) {
        counters.startTime = new Date();
    }
    // Variable to change the color of the letter
    const currentLetter = document.getElementById("letter-" + counters.currentIndex);
    // The key the user needs to press to get it correct
    const correctKey =  paragraph[counters.currentIndex] === " " ? " " : paragraph[counters.currentIndex];

    if (event.key === "Backspace" && counters.currentIndex > 0) {
        counters.currentIndex--;
        counters.backspaceCount++;

        const prevLetter = document.getElementById("letter-" + counters.currentIndex);
        if (prevLetter.classList.contains("correct")) {
            counters.correctCount--;
        }
        else if (prevLetter.classList.contains("incorrect")) {
            counters.incorrectCount--;
        }
        prevLetter.classList.remove("correct", "incorrect");
    }
    else if (counters.currentIndex < paragraph.length) {
        if (event.key === correctKey) {
            currentLetter.classList.remove("incorrect");
            currentLetter.classList.add("correct");
            counters.correctCount++;
            counters.currentIndex++;
        }
        else {
            currentLetter.classList.remove("correct");
            currentLetter.classList.add("incorrect");
            counters.incorrectCount++;
            counters.currentIndex++;
        }
    }  
}

function tutorialLogic(event, counters, paragraph) {
    // Returns if caps lock or shift is pressed then listens for the next key
    if (event.key === "Shift" || event.key === "CapsLock") return;

    // Variable to change the color of the letter
    const currentLetter = document.getElementById("letter-" + counters.currentIndex);
    // The key the user needs to press to get it correct
    const correctKey = paragraph[counters.currentIndex] === " " ? " " : paragraph[counters.currentIndex];

    if (counters.currentIndex < paragraph.length) {
        if (event.key === correctKey) {
            currentLetter.classList.remove("incorrect");
            currentLetter.classList.add("correct");
            counters.currentIndex++;
        } else {
            currentLetter.classList.remove("correct");
            currentLetter.classList.add("incorrect");
        }
    }
}