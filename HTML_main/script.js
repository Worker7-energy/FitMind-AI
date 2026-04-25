document.getElementById("first").addEventListener('click', function() {
    const op = document.getElementById("op");
    if (op.style.display === "flex") {
        op.style.display = "none";
    } else {
        op.style.display = "flex";
    }
});