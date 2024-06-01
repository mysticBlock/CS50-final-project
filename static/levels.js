document.addEventListener("DOMContentLoaded", () => {
    const wordContainer = document.getElementById("wordContainer");
    const paragraph = wordContainer.getAttribute("data-paragraph");

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
            }
            else {
                // Records the time of when user finishes the level
                endTime = new Date();
                // creates variables to store the total time and wpm
                const totalTime = (endTime - startTime) / 1000; // time in seconds
                const totalWords = (correctCount + incorrectCount) / 5; // Average word length of 5 characters
                const wpm = (totalWords) / (totalTime / 60)
                const score = Math.floor (correctCount + wpm)  // Score they have to beat to pass the level
                showReviewModal(correctCount, incorrectCount, totalTime, wpm, score);
            }
        }
    });
    // Displays the review results modal and sends the results to the server where they are stored in the db
    function showReviewModal(correctCount, incorrectCount, totalTime, wpm, score) {
        const resultsModal = document.getElementById("reviewResultsModal");
        document.getElementById("correctCount").textContent = `Correct: ${correctCount}`;
        document.getElementById("incorrectCount").textContent = `Incorrect: ${incorrectCount}`;
        document.getElementById("totalTime").textContent = `Time: ${totalTime.toFixed(2)} seconds`;
        document.getElementById("wpm").textContent = `WPM: ${wpm.toFixed(2)}`;
        document.getElementById("score").textContent = `Score: ${score}`;
        resultsModal.showModal();
        resultsModal.style.display = 'block';
        sendResults(correctCount, incorrectCount, totalTime, wpm, score);
    }

    function sendResults(correctCount, incorrectCount, totalTime, wpm, score) {
        // Creates object to store the data that will be sent to the server-side
        const resultsData = {
            correctCount,
            incorrectCount,
            totalTime,
            wpm,
            score
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
            console.error("Error:", error);
        }
    }

    function showTutorialModal() {
        const tutorialModal = document.getElementById("tutorialResultsModal");
        tutorialModal.showModal();
        tutorialModal.style.display = 'block';
    }

});
