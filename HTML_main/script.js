document.getElementById("first").addEventListener('click', function() {
    const op = document.getElementById("op");
    if (op.style.display === "flex") {
        op.style.display = "none";
    } else {
        op.style.display = "flex";
    }
});
document.getElementById("calcul").addEventListener('click', function(){
    const sch = document.getElementById("sch");
    if (sch.style.display === "flex"){
        sch.style.display = "none";
    } else {
        sch.style.display = "flex";
    }
});