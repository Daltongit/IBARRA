// --- CONEXIÓN SUPABASE IBARRA ---
const supabaseUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- FUNCIONES DE AUTENTICACIÓN ---

// 1. Iniciar Sesión
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
            ciudad: data.ciudad
        };
        sessionStorage.setItem('userInfo', JSON.stringify(sessionData));
        return { success: true, user: data };

    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: error.message };
    }
}

// 2. Verificar si está logueado (Se pone en el <head> de todas las páginas)
function checkAuth() {
    const session = sessionStorage.getItem('userInfo');
    // Si estamos en login.html, no hacemos nada
    if (window.location.pathname.includes('login.html')) return;

    // Si NO hay sesión, mandar al login
    if (!session) {
        window.location.href = 'login.html';
    }
}

// 3. Obtener datos del usuario actual
function getUserInfo() {
    const session = sessionStorage.getItem('userInfo');
    return session ? JSON.parse(session) : null;
}

// 4. Cerrar Sesión
function logout() {
    sessionStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}
