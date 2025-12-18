// JS/script-resultados.js - IBARRA (CORREGIDO)

// 1. CONEXIÓN SUPABASE
const supabaseUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
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

    // Normalizar texto para búsquedas
    const cleanText = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

    try {
        console.log("Iniciando carga de datos...");

        // A) Cargar Resultados desde Supabase
        const { data: intentos, error } = await supabase
            .from('resultados')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw new Error("Error Supabase: " + error.message);
        
        allIntentos = intentos || [];
        console.log("Intentos cargados:", allIntentos.length);

        // B) Cargar Usuarios desde JSON local
        const res = await fetch('DATA/usuarios.json');
        if (!res.ok) throw new Error("No se encontró DATA/usuarios.json");
        allUsuarios = await res.json();
        console.log("Usuarios cargados:", allUsuarios.length);

        // C) Llenar Select de Materias
        const materiasUnicas = [...new Set(allIntentos.map(i => i.materia))].sort();
        materiasUnicas.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; 
            opt.textContent = m;
            fMateria.appendChild(opt);
        });

        // Ocultar spinner y mostrar datos
        if (spinner) spinner.style.display = 'none';
        render();

    } catch (e) {
        console.error(e);
        if (spinner) {
            spinner.innerHTML = `<div style="color:#d32f2f; background:#ffebee; padding:15px; border-radius:8px;">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Error:</strong> ${e.message}<br>
                <small>Verifica la conexión a internet o que la tabla 'resultados' exista en Supabase.</small>
            </div>`;
        }
    }

    // --- FUNCIÓN RENDERIZAR ---
    function render() {
        container.innerHTML = '';
        const busqueda = cleanText(fNombre.value);
        
        // 1. Filtrar Usuarios (Solo Aspirantes que coincidan con filtros)
        const users = allUsuarios.filter(u => 
            u.rol === 'aspirante' && 
            (fCiudad.value === 'Todas' || u.ciudad === fCiudad.value) && 
            (busqueda === '' || cleanText(u.nombre).includes(busqueda))
        );

        if (users.length === 0) { 
            container.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">No se encontraron estudiantes con esos criterios.</p>'; 
            return; 
        }
        
        // 2. Ordenar intentos para mostrar (Recientes primero)
        const intentosParaWeb = [...allIntentos].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

        users.forEach(user => {
            // Buscar intentos de este usuario
            const intentosUser = intentosParaWeb.filter(i => 
                String(i.usuario_id).trim() === String(user.usuario).trim() && 
                (fMateria.value === 'Todas' || i.materia === fMateria.value)
            );

            const card = document.createElement('div'); 
            card.className = 'user-card';
            
            let htmlDetalle = '';
            if (intentosUser.length === 0) {
                htmlDetalle = '<p style="text-align:center; padding:20px; color:#999;">Sin intentos registrados.</p>';
            } else {
                // Agrupar por materia
                const materiasDelUser = [...new Set(intentosUser.map(i=>i.materia))].sort();
                
                materiasDelUser.forEach(m => {
                    const im = intentosUser.filter(i => i.materia === m);
                    htmlDetalle += `
                    <div class="materia-block">
                        <h4 class="materia-title">${m} (${im.length})</h4>
                        <table class="table">
                            <thead><tr><th>NOTA</th><th>FECHA</th><th>HORA</th></tr></thead>
                            <tbody>`;
                    
                    im.forEach(i => {
                        const d = new Date(i.created_at);
                        const colorNota = i.puntaje >= 700 ? '#2e7d32' : '#c62828';
                        htmlDetalle += `
                            <tr>
                                <td style="font-weight:bold; color:${colorNota}">${i.puntaje}</td>
                                <td>${d.toLocaleDateString()}</td>
                                <td>${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
                            </tr>`;
                    });
                    
                    htmlDetalle += `</tbody></table></div>`;
                });
            }

            card.innerHTML = `
                <div class="user-header">
                    <div style="text-align:left;">
                        <h3>${user.nombre}</h3>
                        <small><i class="fas fa-map-marker-alt"></i> ${user.ciudad} | <i class="fas fa-id-card"></i> ${user.usuario}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <button class="btn-pdf-mini"><i class="fas fa-file-pdf"></i> PDF</button>
                        <div style="text-align:right;">
                            <strong style="color:${intentosUser.length>0?'#d32f2f':'#999'}; font-size:1.5rem; font-family:'Teko';">${intentosUser.length}</strong>
                            <span style="display:block; font-size:0.75rem;">INTENTOS</span>
                        </div>
                    </div>
                </div>
                <div class="user-attempts">${htmlDetalle}</div>
            `;
            
            // Eventos de la tarjeta
            card.querySelector('.user-header').onclick = (e) => { 
                if(!e.target.closest('.btn-pdf-mini')){ 
                    const b = card.querySelector('.user-attempts'); 
                    b.style.display = b.style.display === 'block' ? 'none' : 'block'; 
                }
            };
            
            card.querySelector('.btn-pdf-mini').onclick = (e) => { 
                e.stopPropagation(); 
                generatePDF([user], `Reporte_${user.nombre}.pdf`); 
            };
            
            container.appendChild(card);
        });
    }

    // --- EVENTOS FILTROS ---
    fCiudad.onchange = render; 
    fMateria.onchange = render; 
    fNombre.oninput = render;
    
    if(btnPDFGeneral) btnPDFGeneral.onclick = () => {
        const busqueda = cleanText(fNombre.value);
        const users = allUsuarios.filter(u => u.rol==='aspirante' && (fCiudad.value==='Todas'||u.ciudad===fCiudad.value) && (busqueda===''||cleanText(u.nombre).includes(busqueda)));
        if(users.length > 0) generatePDF(users, "Reporte_General_Ibarra.pdf");
        else alert("No hay datos visibles para generar el reporte.");
    };

    // --- GENERADOR PDF ---
    async function generatePDF(usersList, filename) {
        if (!window.jspdf) { alert("Librería PDF no cargada. Recarga la página."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(); 
        let pageAdded = false;

        for (const u of usersList) {
            // Filtrar intentos
            let ints = allIntentos.filter(i => String(i.usuario_id).trim() === String(u.usuario).trim());
            if (fMateria.value !== 'Todas') ints = ints.filter(i => i.materia === fMateria.value);
            
            // Si no tiene intentos y es reporte individual, imprimimos "Sin Intentos"
            if (ints.length === 0) {
                if(pageAdded) doc.addPage(); pageAdded = true;
                header(doc, u, fMateria.value); 
                doc.setFontSize(16); doc.setTextColor(150); doc.text("SIN REGISTROS DE INTENTOS", 105, 100, {align:"center"});
                continue;
            }
            
            const mats = [...new Set(ints.map(i=>i.materia))];
            
            for (const m of mats) {
                const im = ints.filter(i => i.materia === m);
                if(pageAdded) doc.addPage(); pageAdded = true;
                
                header(doc, u, m);
                
                // Estadísticas
                const prom = (im.reduce((a,b)=>a+b.puntaje,0)/im.length).toFixed(0);
                const max = Math.max(...im.map(i=>i.puntaje));
                
                // Cajas Estadísticas
                stat(doc, 140, 45, "PROMEDIO", prom, 211, 47, 47); 
                stat(doc, 170, 45, "MEJOR NOTA", max, 46, 125, 50);
                
                // Gráfico
                const chartData = im.slice(-15); // Últimos 15
                const img = await getChart(chartData);
                if(img) {
                    doc.addImage(img, 'PNG', 15, 80, 180, 60);
                }

                // Tabla
                const rows = [...im].reverse().map((i,idx) => [
                    im.length-idx, 
                    i.puntaje, 
                    new Date(i.created_at).toLocaleDateString(), 
                    new Date(i.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
                ]);
                
                doc.autoTable({ 
                    head:[['#','Nota','Fecha','Hora']], 
                    body:rows, 
                    startY: 150, 
                    theme:'grid', 
                    headStyles:{fillColor:[211, 47, 47]} // Rojo Ibarra
                });
            }
        }
        doc.save(filename);
    }

    function header(doc, u, m) {
        // Fondo Rojo
        doc.setFillColor(211, 47, 47); doc.rect(0,0,210,35,'F');
        // Textos
        doc.setTextColor(255,255,255); doc.setFontSize(22); doc.text("SPARTA ACADEMY", 105, 18, {align:"center"});
        doc.setFontSize(10); doc.text("REPORTE ACADÉMICO - SEDE IBARRA", 105, 26, {align:"center"});
        
        // Datos Alumno
        doc.setTextColor(0,0,0); doc.setFontSize(14); doc.text(u.nombre.toUpperCase(), 15, 50);
        doc.setFontSize(10); doc.setTextColor(100); 
        doc.text(`CÉDULA: ${u.usuario}`, 15, 56); 
        doc.text(`MATERIA: ${m}`, 15, 62);
    }
    
    function stat(doc, x, y, label, val, r, g, b) {
        doc.setFillColor(245,245,245); doc.setDrawColor(200); doc.rect(x,y,30,22,'FD');
        doc.setFontSize(8); doc.setTextColor(100); doc.text(label, x+15, y+6, {align:"center"});
        doc.setFontSize(14); doc.setTextColor(r,g,b); doc.text(String(val), x+15, y+16, {align:"center"});
    }

    async function getChart(data) {
        return new Promise(r => {
            const ctx = canvasHidden.getContext('2d');
            if(window.myChart) window.myChart.destroy();
            
            window.myChart = new Chart(ctx, {
                type: 'bar', 
                data: { 
                    labels: data.map((_,i)=>i+1), 
                    datasets: [{ 
                        data: data.map(i=>i.puntaje), 
                        backgroundColor: data.map(i=>i.puntaje>=700?'#2e7d32':'#d32f2f'),
                        borderRadius: 3
                    }] 
                },
                options: { 
                    animation: false, 
                    plugins: { legend: false }, 
                    scales: { y: { beginAtZero: true, max: 1000, ticks: { display: false } }, x: { display: false } } 
                }
            });
            // Esperar renderizado
            setTimeout(() => r(canvasHidden.toDataURL('image/png')), 200);
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
