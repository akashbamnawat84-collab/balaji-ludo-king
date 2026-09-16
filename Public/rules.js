document.addEventListener("DOMContentLoaded", function () {
    // Back button functionality
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
        backBtn.addEventListener("click", function () {
            window.location.href = "room.html";
        });
    }
});
