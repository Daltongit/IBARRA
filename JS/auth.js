// --- CONFIGURACIÓN SUPABASE (IBARRA) ---
const supabaseUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- LÓGICA DE AUTENTICACIÓN ---
// (Misma lógica, solo cambia la conexión arriba)

async function login(cedula, password) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', cedula)
            .eq('password', password)
            .single();

        if (error || !data) throw new Error("Credenciales incorrectas");

        const sessionData = {
            usuario: data.usuario,
            nombre: data.nombre,
            rol: data.rol,
            ciudad: data.ciudad,
            timestamp: new Date().getTime()
        };
        
        sessionStorage.setItem('userInfo', JSON.stringify(sessionData));
        return { success: true, user: data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

function checkAuth() {
    const session = sessionStorage.getItem('userInfo');
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
}

function getUserInfo() {
    const session = sessionStorage.getItem('userInfo');
    return session ? JSON.parse(session) : null;
}

function logout() {
    sessionStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}
