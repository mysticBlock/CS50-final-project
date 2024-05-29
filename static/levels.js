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

    document.addEventListener("keydown", (event) => {
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
            redirectToResults(correctCount, incorrectCount);
        }
    });

    function redirectToResults(correctCount, incorrectCount) {
        // Creates object to store the data that will be sent to the server-side
        const resultsData = {
            correctCount: correctCount,
            incorrectCount: incorrectCount
        };

        // Sends the resultsData object in JSON format to review-results endpoint
        fetch("/review-results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(resultsData)
        })
        // Processes the response from the server
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to send results to the server");
            }
            return response.json();
        })
        // Shows the correct modal with the correct data from the server
        .then(data => {
            console.log(data);
            if (isReviewLevel) {
                showReviewModal(correctCount, incorrectCount);
            } else if (isTutorialLevel) {
                showTutorialModal();
            }
        })
        // Handles any errors that occur during the fetch request or .then() methods
        .catch(error => {
            console.error("Error:", error);
        });
    }

    function showReviewModal(correctCount, incorrectCount) {
        const modal = document.getElementById("reviewResultsModal");
        document.getElementById("correctCount").textContent = `Correct Letters: ${correctCount}`;
        document.getElementById("incorrectCount").textContent = `Incorrect Letters: ${incorrectCount}`;
        // Add other data like time taken and wpm as needed
        modal.showModal();
    }

    function showTutorialModal() {
        const modal = document.getElementById("tutorialResultsModal");
        modal.showModal();
    }

});
