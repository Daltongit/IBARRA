// JS/auth.js - IBARRA (Lógica JSON Local)

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 Horas

// --- FUNCIÓN LOGIN (Lógica Pura) ---
async function loginUser(usuario, password) {
    try {
        const response = await fetch('DATA/usuarios.json');
        if (!response.ok) throw new Error("Error cargando usuarios.");
        
        const usuarios = await response.json();
        const user = usuarios.find(u => u.usuario === usuario && u.password === password);

        if (!user) return { success: false, message: "Usuario o contraseña incorrectos." };

        // Guardar sesión
        const sessionData = {
            usuario: user.usuario,
            nombre: user.nombre,
            rol: user.rol,
            ciudad: user.ciudad,
            timestamp: Date.now()
        };
        sessionStorage.setItem('userInfo', JSON.stringify(sessionData));
        return { success: true, user: user };

    } catch (error) {
        console.error(error);
        return { success: false, message: "Error del sistema." };
    }
}

// --- UTILIDADES ---
function getUserInfo() {
    try { return JSON.parse(sessionStorage.getItem('userInfo')); } 
    catch (e) { return null; }
}

function isLoggedIn() {
    return !!getUserInfo();
}

function logout() {
    sessionStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}

function checkAuth() {
    if (window.location.pathname.includes('login.html')) return;
    if (!isLoggedIn()) window.location.href = 'login.html';
}

// Exponer globalmente
window.logout = logout;
