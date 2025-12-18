// JS/auth.js - IBARRA (LÓGICA DE LOGIN + SEGURIDAD DE SESIÓN)

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 Horas

// --- 1. FUNCIÓN LOGIN (RESTAURADA: Busca en JSON) ---
async function loginUser(usuario, password) {
    try {
        console.log("Intentando login...");
        
        // Cargar usuarios del archivo local
        const response = await fetch('DATA/usuarios.json');

        if (!response.ok) {
            console.error("Error cargando JSON:", response.status);
            return { success: false, message: "No se encuentra la base de usuarios." };
        }

        const usuarios = await response.json();

        // Validar credenciales (Usando 'contrasena' como en tu archivo original)
        const user = usuarios.find(u => u.usuario === usuario && u.contrasena === password);

        if (!user) {
            return { success: false, message: "Usuario o contraseña incorrectos." };
        }

        // --- INICIO DE SESIÓN EXITOSO ---
        
        // Calcular expiración
        const expirationTime = Date.now() + SESSION_TIMEOUT_MS;

        // Guardar datos de sesión
        const sessionData = {
            usuario: user.usuario,
            nombre: user.nombre,
            rol: user.rol,
            ciudad: user.ciudad
        };

        // Guardar en Storage
        sessionStorage.setItem('userInfo', JSON.stringify(sessionData));
        sessionStorage.setItem('sessionExpiration', expirationTime.toString());

        return { success: true, user: user };

    } catch (error) {
        console.error(error);
        return { success: false, message: "Error técnico al leer datos." };
    }
}

// --- 2. SISTEMA DE SEGURIDAD (CANDADO) ---

// Verificar sesión al cargar cualquier página (menos login)
function checkAuth() {
    // Si estamos en login.html, no hacemos nada
    if (window.location.href.includes('login.html')) return;

    const user = sessionStorage.getItem('userInfo');
    const expiration = sessionStorage.getItem('sessionExpiration');

    // Si no hay usuario O la sesión expiró
    if (!user || !expiration || Date.now() > parseInt(expiration)) {
        forceLogout();
    } else {
        resetInactivityTimer(); // Todo bien, reiniciamos el reloj de inactividad
    }
}

// Bloqueo del botón "Atrás" del navegador
window.addEventListener('pageshow', function (event) {
    // Si la página se carga desde la memoria caché (al dar atrás)
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload(); // Obligamos a recargar para que checkAuth corra de nuevo
    }
});

// --- 3. UTILIDADES ---

function getUserInfo() {
    const data = sessionStorage.getItem('userInfo');
    return data ? JSON.parse(data) : null;
}

// Cerrar sesión voluntario
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('login.html'); // .replace borra el historial inmediato
}

// Expulsión forzada (por seguridad)
function forceLogout() {
    sessionStorage.clear();
    window.location.replace('login.html');
}

// Temporizador de inactividad
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Tu sesión ha expirado por inactividad.");
        logout();
    }, SESSION_TIMEOUT_MS);
}

// Activar monitores de actividad
if (typeof document !== 'undefined') {
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);
}

// Exponer globalmente para los botones HTML
window.logout = logout;
