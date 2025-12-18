// JS/auth.js - IBARRA (Lógica JSON Local)

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 Horas
let inactivityTimer;

// --- LOGIN CON JSON (Igual a Tulcán) ---
async function login(cedula, password) {
    try {
        // 1. Cargar el archivo JSON local
        const response = await fetch('DATA/usuarios.json');
        if (!response.ok) throw new Error("No se pudo cargar la base de usuarios.");
        
        const usuarios = await response.json();

        // 2. Buscar coincidencias
        const user = usuarios.find(u => u.usuario === cedula && u.password === password);

        if (!user) throw new Error("Credenciales incorrectas");

        // 3. Guardar sesión
        const sessionData = {
            usuario: user.usuario,
            nombre: user.nombre,
            rol: user.rol,
            ciudad: user.ciudad,
            timestamp: new Date().getTime()
        };
        
        sessionStorage.setItem('userInfo', JSON.stringify(sessionData));
        sessionStorage.setItem('sessionExpiration', (Date.now() + SESSION_TIMEOUT_MS).toString());
        
        return { success: true, user: user };

    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: error.message };
    }
}

// --- VERIFICACIÓN DE SESIÓN ---
function isLoggedIn() {
    const expiration = sessionStorage.getItem('sessionExpiration');
    if (!expiration || Date.now() > parseInt(expiration)) {
        clearSession();
        return false;
    }
    resetInactivityTimer();
    return true;
}

function getUserInfo() {
    if (!isLoggedIn()) return null;
    try {
        return JSON.parse(sessionStorage.getItem('userInfo'));
    } catch (e) {
        clearSession();
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('sessionExpiration');
    clearTimeout(inactivityTimer);
}

// --- SALIR ---
function logoutUser() {
    clearSession();
    window.location.href = 'login.html';
}

// --- PROTECCIÓN DE PÁGINAS ---
function checkAuth() {
    // Si estamos en login, no hacemos nada
    if (window.location.pathname.includes('login.html')) return;
    
    // Si no hay sesión, chao
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Tu sesión ha expirado por inactividad.");
        logoutUser();
    }, SESSION_TIMEOUT_MS);
}

// Exponer logout globalmente para el botón del Header
window.logout = logoutUser;
