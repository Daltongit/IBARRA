// JS/auth.js - IBARRA (Corregido para leer "contrasena")

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 Horas

// --- 1. FUNCIÓN LOGIN (Busca en JSON) ---
async function loginUser(usuario, password) {
    try {
        // Cargar usuarios del archivo
        const response = await fetch('DATA/usuarios.json');
        
        if (!response.ok) {
            console.error("Error cargando JSON:", response.status);
            return { success: false, message: "No se encuentra la base de usuarios." };
        }
        
        const usuarios = await response.json();
        
        // CORRECCIÓN AQUÍ: Usamos 'contrasena' en lugar de 'password'
        const user = usuarios.find(u => u.usuario === usuario && u.contrasena === password);

        if (!user) {
            return { success: false, message: "Usuario o contraseña incorrectos." };
        }

        // Guardar Sesión
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
        return { success: false, message: "Error técnico al leer datos." };
    }
}

// --- 2. UTILIDADES DE SESIÓN ---
function isLoggedIn() {
    return sessionStorage.getItem('userInfo') !== null;
}

function getUserInfo() {
    const data = sessionStorage.getItem('userInfo');
    return data ? JSON.parse(data) : null;
}

function logout() {
    sessionStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}

function checkAuth() {
    // Si no estamos en login y no hay sesión, botar al login
    if (!window.location.href.includes('login.html') && !isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Exponer globalmente para el botón Salir
window.logout = logout;
