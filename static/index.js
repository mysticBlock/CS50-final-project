document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".level-button").forEach(button => {
        const levelNumber = parseInt(button.dataset.levelNumber);
        if (levelNumber > highestLevelCompleted + 1) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    });
});