document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".level-button").forEach(button => {
        const levelNumber = parseInt(button.dataset.levelNumber);
        if (levelNumber > highestLevelCompleted + 1) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    });

    // Activates dropdown when profile picture is clicked
    const profileIcon = document.querySelector("[data-dropdown-img]");
    const dropdown = document.querySelector("[data-dropdown]");

    if (profileIcon) {
        profileIcon.addEventListener("click", (e) => {
            dropdown.classList.toggle("active");
            e.stopPropagation(); // Prevent the click event from propagating to the window
        });

        // Close the dropdown if the user clicks outside of it
        window.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove("active");
            }
        });
    }
});