document.addEventListener("DOMContentLoaded", () => {
    const wordContainer = document.getElementById("wordContainer");
    const paragraph = wordContainer.getAttribute("data-paragraph");
 
    // Object with the details for every level
    // Used for determining the next level type for navigation to the next level
    // Also used for the passScore of each review level
    const levelProgression = {
        1: {"levelType": "tutorial"},
        2: {"levelType": "review", "passScore": 50},
        3: {"levelType": "tutorial"}
    }

    // Iterates through each character in the paragraph
    for (let i = 0; i < paragraph.length; i++) {
        const char = paragraph[i];
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = char === " " ? "_" : char;  // Uses a visible representation for space
        span.id = "letter-" + i;
        wordContainer.appendChild(span);
    }

    // Keeps track of the current letter and how many they got correct and incorrect
    let currentIndex = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let backspaceCount = 0;
    let startTime = null;
    let endTime = null;


    document.addEventListener("keydown", (event) => {
        // Records the time from when the user hits the first key
        if (!startTime && isReviewLevel) {
            startTime = new Date();
        }

        const currentLetter = document.getElementById("letter-" + currentIndex);
        const expectedKey = paragraph[currentIndex] === " " ? " " : paragraph[currentIndex];

        // Logic for tutorial levels
        // isTutorialLevel and isReviewLevel are defined in python and imported in level-layout.html
        if (isTutorialLevel) {
            if (currentIndex < paragraph.length) {
                if (event.key === expectedKey) {
                    currentLetter.classList.remove("incorrect");
                    currentLetter.classList.add("correct");
                    currentIndex++;
                } 
                else {
                    currentLetter.classList.remove("correct");
                    currentLetter.classList.add("incorrect");
                }
            }
        }

        // Logic for review levels
        if (isReviewLevel) {  
            if (event.key === "Backspace" && currentIndex > 0) {
                currentIndex--;
                backspaceCount++;

                const prevLetter = document.getElementById("letter-" + currentIndex);
                if (prevLetter.classList.contains("correct")) {
                    correctCount--;
                } 
                else if (prevLetter.classList.contains("incorrect")) {
                    incorrectCount--;
                }
                prevLetter.classList.remove("correct", "incorrect");
            } 
            else if (currentIndex < paragraph.length) {
                if (event.key === expectedKey) {
                    currentLetter.classList.remove("incorrect");
                    currentLetter.classList.add("correct");
                    correctCount++;
                    currentIndex++;
                } 
                else {
                    currentLetter.classList.remove("correct");
                    currentLetter.classList.add("incorrect");
                    incorrectCount++;
                    currentIndex++;
                }
            }
        } 

        // Checks if the user has completed the level
        if (currentIndex >= paragraph.length) {

            if (isTutorialLevel) {
                showTutorialModal();

                const tutorialNextLevel = document.getElementById("tutorialNextLevel"); 
                tutorialNextLevel.addEventListener("click", nextLevel);
            }
            else {
                // Records the time of when user finishes the level
                endTime = new Date();
                // Creates variables to store the total time, wpm and score
                const totalTime = (endTime - startTime) / 1000; // Time in seconds
                const totalWords = (correctCount + incorrectCount) / 5; // Average word length of 5 characters
                const wpm = (totalWords) / (totalTime / 60)

                // Accuracy calculation
                const totalAttempts = correctCount + incorrectCount + backspaceCount;
                const accuracy = Math.floor((correctCount / totalAttempts) * 100);

                // Score calculations
                const weightWpm = 0.4;
                const weightAccuracy = 0.6;
                const score = Math.floor ((weightAccuracy * accuracy) + (weightWpm * wpm))  // Score they get to pass the level
                const passScore = levelProgression[currentLevel].passScore // Score they have to beat to pass the level (from object)

                // Calls showReviewModal function (shows the review modal)
                showReviewModal(correctCount, incorrectCount, totalTime, wpm, accuracy, score, passScore);

                // Event listeners for next level & retry buttons
                const reviewNextLevel = document.getElementById("reviewNextLevel");
                    reviewNextLevel.addEventListener("click", nextLevel);
    
                const retryButton = document.getElementById("retryLevel");
                retryButton.addEventListener("click", () => location.reload());
            }
        }
    });

    // Displays the tutorial modal
    function showTutorialModal() {
        const tutorialModal = document.getElementById("tutorialResultsModal");
        const nextLevelButton = document.getElementById("tutorialNextLevel");

        tutorialModal.style.display = "block";
        nextLevelButton.style.display = "inline-block";
    }

    // Displays the review results modal and sends the results to the server where they are stored in the db
    function showReviewModal(correctCount, incorrectCount, totalTime, wpm, accuracy, score, passScore) {
        const resultsModal = document.getElementById("reviewResultsModal");

        document.getElementById("correctCount").textContent = `Correct: ${correctCount}`;
        document.getElementById("incorrectCount").textContent = `Incorrect: ${incorrectCount}`;
        document.getElementById("totalTime").textContent = `Time: ${totalTime.toFixed(2)} seconds`;
        document.getElementById("wpm").textContent = `WPM: ${wpm.toFixed(2)}`;
        document.getElementById("accuracy").textContent = `Accuracy: ${accuracy}%`;
        document.getElementById("score").textContent = `Score: ${score}`;

        resultsModal.style.display = "block";

        toggleButtons(score, passScore);
        sendResults(correctCount, incorrectCount, totalTime, wpm, accuracy, score, passScore);
        updateHighestLevelCompleted()
    }


    function sendResults(correctCount, incorrectCount, totalTime, wpm, accuracy, score, passScore) {
        // Creates object to store the data that will be sent to the server-side
        const resultsData = {
            correctCount,
            incorrectCount,
            totalTime,
            wpm,
            accuracy,
            score,
            passScore
        };

        try {
            // Sends the resultsData object in JSON format to review-results endpoint
            fetch("/review-results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(resultsData)
            })
        } 
        catch (error) {
            console.error("Error: failed to send resultsData", error);
        }
    }


    // Navigates to the next level
    function nextLevel() {
        const lastLevel = Object.keys(levelProgression).length;
        const currentLevelNum = Number(currentLevel);

        if (currentLevelNum === lastLevel) {
            return window.location.href = "/levels/congratulations";
        }
        else if (levelProgression[currentLevelNum + 1]) {
            const nextLevelType = levelProgression[currentLevelNum + 1].levelType;
            const nextLevelNumber = currentLevelNum +1;

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
});
