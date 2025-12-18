// JS/auth.js - IBARRA (Conexión + Lógica)

// --- CONEXIÓN SUPABASE IBARRA ---
const supabaseUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 Horas
let inactivityTimer;

// Función para Login (Usada en login.html)
async function login(cedula, password) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', cedula)
            .eq('password', password)
            .single();

        if (error || !data) throw new Error("Credenciales incorrectas");

        // Guardar sesión
        const sessionData = {
            usuario: data.usuario,
            nombre: data.nombre,
            rol: data.rol,
            ciudad: data.ciudad,
            timestamp: new Date().getTime()
        };
        sessionStorage.setItem('userInfo', JSON.stringify(sessionData));
        sessionStorage.setItem('sessionExpiration', (Date.now() + SESSION_TIMEOUT_MS).toString());
        
        return { success: true, user: data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

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
        console.error("Error parsing user info", e);
        clearSession();
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('sessionExpiration');
    clearTimeout(inactivityTimer);
}

// Función principal de cierre de sesión
function logoutUser() {
    clearSession();
    window.location.href = 'login.html';
}

function checkAuth() {
    // No chequear en login
    if (window.location.pathname.includes('login.html')) return;
    
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

// ESTO HACE QUE FUNCIONE EL BOTÓN EN TODOS LADOS
window.logout = logoutUser;
