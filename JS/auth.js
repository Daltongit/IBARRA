// JS/auth.js - SEGURIDAD TOTAL

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 Horas

// 1. FUNCIÓN PARA VERIFICAR SESIÓN (SE EJECUTA AL INICIO)
function checkAuth() {
    const user = sessionStorage.getItem('userInfo');
    const expiration = sessionStorage.getItem('sessionExpiration');

    // Si no hay usuario o la sesión expiró
    if (!user || !expiration || Date.now() > parseInt(expiration)) {
        forceLogout(); // Patea al usuario fuera
    } else {
        resetInactivityTimer(); // Todo bien, reinicia contador
    }
}

// 2. EL CANDADO "ANTI-ATRÁS" (Bloquea la flecha de regresar)
window.addEventListener('pageshow', function (event) {
    // Si la página viene de la "memoria caché" (flecha atrás)
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload(); // Obliga a recargar para que checkAuth corra de nuevo
    }
});

// 3. FUNCIONES DE SESIÓN
function getUserInfo() {
    if (!sessionStorage.getItem('userInfo')) return null;
    return JSON.parse(sessionStorage.getItem('userInfo'));
}

function saveSession(userInfo) {
    const expirationTime = Date.now() + SESSION_TIMEOUT_MS;
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    sessionStorage.setItem('sessionExpiration', expirationTime.toString());
}

// 4. CERRAR SESIÓN (LIMPIEZA TOTAL)
function logout() {
    sessionStorage.clear(); // Borra todo
    localStorage.clear();   // Por si acaso
    window.location.replace('login.html'); // .replace evita que puedan volver atrás
}

function forceLogout() {
    sessionStorage.clear();
    // Solo redirige si NO estamos ya en el login
    if (!window.location.href.includes('login.html')) {
        window.location.replace('login.html');
    }
}

// 5. TEMPORIZADOR DE INACTIVIDAD
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Tu sesión ha expirado por inactividad.");
        logout();
    }, SESSION_TIMEOUT_MS);
}

// Activar listeners
window.onload = function() {
    document.body.addEventListener('mousemove', resetInactivityTimer);
    document.body.addEventListener('keypress', resetInactivityTimer);
}
