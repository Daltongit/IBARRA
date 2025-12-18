// JS/script-resultados.js - IBARRA

// --- 1. CONEXIÓN SUPABASE (Solo para Resultados) ---
const supabaseUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', async () => {
    // Referencias DOM
    const container = document.getElementById('reporte-container');
    const fMateria = document.getElementById('filtro-materia');
    const fCiudad = document.getElementById('filtro-ciudad');
    const fNombre = document.getElementById('filtro-nombre');
    const spinner = document.getElementById('loading-spinner');
    const btnPDFGeneral = document.getElementById('descargar-pdf-btn');
    const btnCSV = document.getElementById('descargar-general-csv-btn');
    const canvasHidden = document.getElementById('hidden-chart-canvas');

    let allIntentos = [];
    let allUsuarios = [];

    const cleanText = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

    // --- 2. CARGA DE DATOS ---
    try {
        // A) Cargar Resultados de la Nube (Supabase)
        const { data: intentos, error } = await supabase
            .from('resultados')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw new Error("Error conectando a BD Resultados: " + error.message);
        allIntentos = intentos || [];

        // B) Cargar Usuarios del JSON Local
        const res = await fetch('DATA/usuarios.json');
        if (!res.ok) throw new Error("Error cargando usuarios.json");
        allUsuarios = await res.json();
        
        // C) Llenar Filtro Materias
        [...new Set(allIntentos.map(i => i.materia))].sort().forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            fMateria.appendChild(opt);
        });

        if (spinner) spinner.style.display = 'none';
        render();

    } catch (e) {
        if (spinner) spinner.innerHTML = `<p style="color:red; font-weight:bold;">${e.message}</p>`;
        console.error(e);
    }

    // --- 3. RENDERIZADO ---
    function render() {
        container.innerHTML = '';
        const busqueda = cleanText(fNombre.value);
        
        // Filtramos usuarios locales (Aspirantes)
        const users = allUsuarios.filter(u => 
            u.rol === 'aspirante' && 
            (fCiudad.value === 'Todas' || u.ciudad === fCiudad.value) && 
            (busqueda === '' || cleanText(u.nombre).includes(busqueda))
        );

        if (users.length === 0) { 
            container.innerHTML = '<p style="text-align:center;color:#666;">No se encontraron estudiantes.</p>'; 
            return; 
        }
        
        // Ordenar intentos (Más reciente arriba)
        const intentosParaWeb = [...allIntentos].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

        users.forEach(user => {
            // Cruzar ID de usuario local con ID en base de datos
            const intentosUser = intentosParaWeb.filter(i => 
                String(i.usuario_id).trim() === String(user.usuario).trim() && 
                (fMateria.value === 'Todas' || i.materia === fMateria.value)
            );

            const card = document.createElement('div'); 
            card.className = 'user-card';
            let html = '';

            if (intentosUser.length === 0) {
                html = '<p style="text-align:center;padding:15px;color:#999;">Sin intentos registrados.</p>';
            } else {
                [...new Set(intentosUser.map(i=>i.materia))].sort().forEach(m => {
                    const im = intentosUser.filter(i=>i.materia===m);
                    html += `<div class="materia-block"><h4 class="materia-title">${m} (${im.length})</h4><table class="table"><thead><tr><th>NOTA</th><th>FECHA</th><th>HORA</th></tr></thead><tbody>`;
                    im.forEach(i => {
                        const d = new Date(i.created_at);
                        const colorNota = i.puntaje >= 700 ? '#2e7d32' : '#c62828';
                        html += `<tr><td style="font-weight:bold;color:${colorNota}">${i.puntaje}</td><td>${d.toLocaleDateString()}</td><td>${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td></tr>`;
                    });
                    html += `</tbody></table></div>`;
                });
            }

            card.innerHTML = `
                <div class="user-header">
                    <div style="text-align:left;"><h3>${user.nombre}</h3><small>${user.ciudad}</small></div>
                    <div style="display:flex;align-items:center;">
                        <button class="btn-pdf-mini"><i class="fas fa-file-pdf"></i> PDF</button>
                        <div style="text-align:right; margin-left:15px;">
                            <strong style="color:${intentosUser.length>0?'#d32f2f':'#999'};font-size:1.5rem;font-family:'Teko';">${intentosUser.length}</strong>
                            <span style="display:block;font-size:0.75rem;">TOTAL</span>
                        </div>
                    </div>
                </div>
                <div class="user-attempts">${html}</div>`;
            
            // Eventos
            card.querySelector('.user-header').onclick = (e) => { 
                if(!e.target.closest('.btn-pdf-mini')){ 
                    const b = card.querySelector('.user-attempts'); 
                    b.style.display = b.style.display==='block'?'none':'block'; 
                }
            };
            card.querySelector('.btn-pdf-mini').onclick = (e) => { 
                e.stopPropagation(); 
                generatePDF([user], `Reporte_${user.nombre}.pdf`); 
            };
            container.appendChild(card);
        });
    }

    fCiudad.onchange = render; fMateria.onchange = render; fNombre.oninput = render;
    
    if(btnPDFGeneral) btnPDFGeneral.onclick = () => {
        const busqueda = cleanText(fNombre.value);
        const users = allUsuarios.filter(u => u.rol==='aspirante' && (fCiudad.value==='Todas'||u.ciudad===fCiudad.value) && (busqueda===''||cleanText(u.nombre).includes(busqueda)));
        if(users.length>0) generatePDF(users, "Reporte_General.pdf");
    };

    // --- PDF GENERATOR (IGUAL A TULCÁN PERO CON TÍTULO IBARRA) ---
    async function generatePDF(usersList, filename) {
        const doc = new jsPDF(); let pageAdded = false;
        for (const u of usersList) {
            let ints = allIntentos.filter(i => String(i.usuario_id).trim()===String(u.usuario).trim());
            if (fMateria.value !== 'Todas') ints = ints.filter(i => i.materia === fMateria.value);
            
            if (ints.length === 0) {
                if(pageAdded) doc.addPage(); pageAdded = true;
                header(doc, u, fMateria.value); 
                doc.setFontSize(20); doc.setTextColor(150); doc.text("SIN INTENTOS", 105, 100, {align:"center"});
                continue;
            }
            
            const mats = [...new Set(ints.map(i=>i.materia))];
            for (const m of mats) {
                const im = ints.filter(i=>i.materia===m);
                if(pageAdded) doc.addPage(); pageAdded = true;
                header(doc, u, m);
                
                const prom = (im.reduce((a,b)=>a+b.puntaje,0)/im.length).toFixed(0);
                const max = Math.max(...im.map(i=>i.puntaje));
                stat(doc, 140, 45, "PROMEDIO", prom, 178,34,34); 
                stat(doc, 170, 45, "MEJOR", max, 39,174,96);
                
                // Gráfico
                const chartData = im.slice(-20);
                const img = await getChart(chartData);
                if(img) doc.addImage(img, 'PNG', 14, 80, 180, 65);

                // Tabla
                const rows = [...im].reverse().map((i,idx) => [im.length-idx, i.puntaje, new Date(i.created_at).toLocaleDateString(), new Date(i.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})]);
                doc.autoTable({ head:[['#','Nota','Fecha','Hora']], body:rows, startY:155, theme:'grid', headStyles:{fillColor:[211, 47, 47]} }); // Rojo en PDF
            }
        }
        doc.save(filename);
    }

    function header(doc, u, m) {
        doc.setFillColor(211, 47, 47); // Rojo Ibarra
        doc.rect(0,0,210,35,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(20); doc.text("SPARTA ACADEMY IBARRA", 105, 18, {align:"center"});
        doc.setFontSize(10); doc.text("REPORTE DE RENDIMIENTO", 105, 26, {align:"center"});
        doc.setTextColor(0,0,0); doc.setFontSize(14); doc.text(u.nombre.toUpperCase(), 14, 48);
        doc.setFontSize(10); doc.setTextColor(100); doc.text(`CIUDAD: ${u.ciudad}`, 14, 54); doc.text(`MATERIA: ${m}`, 14, 59);
    }
    
    function stat(doc, x, y, l, v, r, g, b) {
        doc.setFillColor(245,245,245); doc.rect(x,y,25,20,'F');
        doc.setFontSize(7); doc.setTextColor(100); doc.text(l, x+12.5, y+5, {align:"center"});
        doc.setFontSize(12); doc.setTextColor(r,g,b); doc.text(String(v), x+12.5, y+15, {align:"center"});
    }

    async function getChart(data) {
        return new Promise(r => {
            const ctx = canvasHidden.getContext('2d');
            if(window.myChart) window.myChart.destroy();
            window.myChart = new Chart(ctx, {
                type: 'bar', 
                data: { labels: data.map((_,i)=>i+1), datasets: [{ data: data.map(i=>i.puntaje), backgroundColor: data.map(i=>i.puntaje>=700?'#2e7d32':'#c62828') }] },
                options: { animation: false, plugins: { legend: false }, scales: { y: { beginAtZero: true, max: 1000 } } }
            });
            setTimeout(() => r(canvasHidden.toDataURL('image/png')), 150);
        });
    }
    
    if (btnCSV) {
        btnCSV.onclick = () => {
            let csv = "Nombre,Ciudad,Materia,Nota,Fecha,Hora\n";
            const visibles = allUsuarios.filter(u => u.rol==='aspirante' && (fCiudad.value==='Todas'||u.ciudad===fCiudad.value));
            visibles.forEach(u => {
                const ints = allIntentos.filter(i => String(i.usuario_id)===String(u.usuario) && (fMateria.value==='Todas'||i.materia===fMateria.value));
                if(ints.length===0) csv += `${u.nombre},${u.ciudad},SIN INTENTOS,0,--,--\n`;
                else ints.forEach(i => csv += `${u.nombre},${u.ciudad},${i.materia},${i.puntaje},${new Date(i.created_at).toLocaleDateString()},${new Date(i.created_at).toLocaleTimeString()}\n`);
            });
            const link = document.createElement("a"); link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); link.download = "Reporte_Ibarra.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        };
    }
});
