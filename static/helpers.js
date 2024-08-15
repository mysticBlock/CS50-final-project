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
    // Creates the cursor
    const cursor = document.createElement("div");
    cursor.id = "cursor";
    cursor.className = "cursor blink";
    wordContainer.appendChild(cursor);
    
    // Uses regex to split the paragraph into words whilst saving the spaces
    let words = paragraph.split(/( )/);

    // Wraps each word in a span and then each character within those word spans
    let charIndex = 0;
    words.forEach((word) => {
        const wordSpan = document.createElement("span");
        if (word === " ") {
            wordSpan.className = "space"
        }
        else {
            wordSpan.className = "word";
        } 

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const charSpan = document.createElement("span");
            charSpan.className = "letter";

            if (char === " ") {
                charSpan.classList.add("letter-space");
                charSpan.textContent = "\u00A0";
            }
            else {
                charSpan.textContent = char;
            }
            charSpan.id = `char-${charIndex}`;
            wordSpan.appendChild(charSpan);
            charIndex++;
        }
        wordContainer.appendChild(wordSpan);
    });
     // Initializes cursor position
    updateCursor();
}

function updateCursor() {
    const cursor = document.getElementById("cursor");
    const currentChar = document.getElementById("char-" + counters.currentIndex);

    if (currentChar) {
        const rect = currentChar.getBoundingClientRect();
        cursor.style.left = `${rect.left}px`;
        cursor.style.top = `${rect.top}px`;
    }
}

function reviewLogic(event, counters, paragraph) {
    // Returns if caps lock or shift is pressed then listens for the next key
    if (event.key === "Shift" || event.key === "CapsLock") return;

    // Records the time from when the user hits the first key
    if (!counters.startTime) {
        counters.startTime = new Date();
    }

    // Stops cursor blinking
    const cursor = document.getElementById("cursor");
    if (cursor.classList.contains('blink')) {
        cursor.classList.remove('blink'); 
    }

    // Variable to change the color of the char
    const currentChar = document.getElementById("char-" + counters.currentIndex);
    // The key the user needs to press to get it correct
    const correctKey =  paragraph[counters.currentIndex] === " " ? " " : paragraph[counters.currentIndex];

    if (event.key === "Backspace" && counters.currentIndex > 0) {
        counters.currentIndex--;
        counters.backspaceCount++;

        // Replaces the wrong letter they typed to a space so they can attempt it again
        const prevLetter = document.getElementById("char-" + counters.currentIndex);
        if (prevLetter.classList.contains("letter-space")) {
            prevLetter.textContent = "\u00A0";
        }

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
            currentChar.classList.remove("incorrect");
            currentChar.classList.add("correct");
            counters.correctCount++;
            counters.currentIndex++;
        }
        else if (correctKey === " " && event.key !== correctKey) {
            currentChar.classList.remove("correct");
            currentChar.classList.add("incorrect");
            currentChar.textContent = event.key ;
            counters.incorrectCount++;
            counters.currentIndex++;   
        }
        else {
            currentChar.classList.remove("correct");
            currentChar.classList.add("incorrect");
            counters.incorrectCount++;
            counters.currentIndex++;
        }
    } 
    updateCursor(); 
}

function tutorialLogic(event, counters, paragraph) {
    // Returns if caps lock or shift is pressed then listens for the next key
    if (event.key === "Shift" || event.key === "CapsLock") return;

    // Stops cursor blinking
    const cursor = document.getElementById("cursor");
    if (cursor.classList.contains('blink')) {
        cursor.classList.remove('blink'); 
    }

    // Variable to change the color of the letter
    const currentChar = document.getElementById("char-" + counters.currentIndex);
    // The key the user needs to press to get it correct
    const correctKey = paragraph[counters.currentIndex] === " " ? " " : paragraph[counters.currentIndex];

    if (counters.currentIndex < paragraph.length) {
        if (event.key === correctKey) {
            currentChar.classList.remove("incorrect");
            currentChar.classList.add("correct");
            counters.currentIndex++;
        } else {
            currentChar.classList.remove("correct");
            // Removes letter-space so padding doesn't get applied when in tutorial level
            currentChar.classList.remove("letter-space");
            currentChar.classList.add("incorrect");
            currentChar.classList.add("shake");
        }
    }
    updateCursor(); 
}