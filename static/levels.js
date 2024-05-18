document.addEventListener("DOMContentLoaded", () => {
    const wordContainer = document.getElementById("wordContainer");
    const paragraph = wordContainer.getAttribute("data-paragraph");

    // Iterate through each character in the paragraph
    for (let i = 0; i < paragraph.length; i++) {
        const char = paragraph[i];
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = char === " " ? "_" : char;  // Use a visible representation for space
        span.id = "letter-" + i;
        wordContainer.appendChild(span);
    }

    let currentIndex = 0;

    document.addEventListener("keydown", (event) => {
        const currentLetter = document.getElementById("letter-" + currentIndex);
        const expectedKey = paragraph[currentIndex] === " " ? " " : paragraph[currentIndex];

        if (event.key === "Backspace" && currentIndex > 0) {
            currentIndex--;
            const prevLetter = document.getElementById("letter-" + currentIndex);
            prevLetter.classList.remove("correct", "incorrect");
        } else if (currentIndex < paragraph.length) {
            if (event.key === expectedKey) {
                currentLetter.classList.remove("incorrect");
                currentLetter.classList.add("correct");
                currentIndex++;
            } else {
                currentLetter.classList.remove("correct");
                currentLetter.classList.add("incorrect");
                currentIndex++;
            }
        }
    });
});

    