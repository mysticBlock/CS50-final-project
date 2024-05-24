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

    // Determines the level type for corresponding JS logic
    const page = window.location.pathname;
    const isReviewLevel = page.includes("review");
    const isTutorialLevel = page.includes("tutorial");

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
            redirectToResults();
        }
    });

    function submitDataToServer(data, url) {
        fetch(`"/${url}"`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: data}),
        })
        .then(response => response.json())   
    }

    function redirectToResults(correctCount, incorrectCount) {
        if (isTutorialLevel) {
            window.location.href = "/tutorial-results";
        }
        else if (isReviewLevel) {
            submitDataToServer()
            window.location.href = "/review-results";
        }
    }
});
