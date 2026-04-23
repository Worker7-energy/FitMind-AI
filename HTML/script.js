function check_email(){
    const email = document.getElementById('email');
    const value = email.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(value)){
        alert("OK");
        return true;
    } else {
        alert("Неверно");
        return false;
    }
}



function check_password() {
    const password = document.getElementById("password");
    const value = password.value;
    const passwordRegex = /^.{8,}$/;
    
    if (passwordRegex.test(value)) {
        alert("OK");
        check_email();
        return true;
    } else {
        alert("Упс! Пароль должен содержать минимум 8 символов");
        check_email();
        return false;
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        check_password(); 
    }
});