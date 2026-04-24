function check_email(){
    const email = document.getElementById('email');
    const value = email.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(value)){
        alert("Введён корректный email");
        check_password();
        return true;
    } else {
        alert("Введён некорректный email");
        check_password();
        return false;
    }
}



function check_password() {
    const password = document.getElementById("password");
    const value = password.value;
    const passwordRegex = /^.{8,}$/;
    
    if (passwordRegex.test(value)) {
        alert("Пароль подходит!");
        return true;
    } else {
        alert("Упс! Пароль должен содержать минимум 8 символов");
        return false;
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        check_email(); 
    }
});

document.getElementById("but").addEventListener("click", check_email);

