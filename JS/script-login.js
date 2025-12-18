// JS/script-login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const userInput = document.getElementById('usuario');
    const passInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-message');
    const btnLogin = document.getElementById('btn-login');

    // Toggle Password
    const toggleEye = document.querySelector('.toggle-password');
    if(toggleEye) {
        toggleEye.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            toggleEye.classList.toggle('fa-eye');
            toggleEye.classList.toggle('fa-eye-slash');
        });
    }

    // Manejo del Submit
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
            btnLogin.disabled = true;

            const user = userInput.value.trim();
            const pass = passInput.value.trim();

            if(!user || !pass) {
                showError("Por favor complete todos los campos.");
                resetBtn();
                return;
            }

            // Llamar a la lógica de auth.js
            const result = await loginUser(user, pass);

            if(result.success) {
                window.location.href = 'index.html';
            } else {
                showError(result.message);
                resetBtn();
            }
        });
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }

    function resetBtn() {
        btnLogin.innerHTML = 'Iniciar Sesión';
        btnLogin.disabled = false;
    }
});
