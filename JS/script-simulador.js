// JS/script-simulador.js - IBARRA (MODAL REPARADO)

// 1. CONEXIÓN SUPABASE
const simuladorUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const simuladorKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';
const simuladorDB = window.supabase.createClient(simuladorUrl, simuladorKey);

document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTOS DOM
    const lobbyContainer = document.getElementById('lobby-container');
    const simuladorContainer = document.getElementById('simulador-container'); // ID DIRECTO
    const resultadosContainer = document.getElementById('resultados-container'); // ID DIRECTO
    const btnStart = document.getElementById('comenzar-btn');
    
    // Variables de Lógica
    let questions = [];
    let phase1Data = []; 
    let phase2Blocks = []; 
    let userAnswers = [];
    let tableAnswersText = {}; 
    let tableAnswersImg = {}; 
    let timerInterval;
    let timeLeft = 3600;
    let modeType = 'normal'; // IMPORTANTE: Define el tipo de examen
    let carpetaEspecialID = null;

    // --- CONFIGURACIÓN DE MATERIAS ---
    const materias = {
        'sociales': 'Ciencias Sociales', 'matematicas': 'Matemáticas y Física', 'lengua': 'Lengua y Literatura', 'ingles': 'Inglés', 'general': 'General (Todas)',
        'inteligencia': 'Inteligencia', 'personalidad': 'Personalidad', 'ppnn1': 'Cuestionario 1 PPNN', 'ppnn2': 'Cuestionario 2 PPNN', 'ppnn3': 'Cuestionario 3 PPNN', 'ppnn4': 'Cuestionario 4 PPNN',
        'sociales_esmil': 'Ciencias Sociales (ESMIL)', 'matematicas_esmil': 'Matemáticas (ESMIL)', 'lengua_esmil': 'Lenguaje (ESMIL)', 'ingles_esmil': 'Inglés (ESMIL)', 'general_esmil': 'General ESMIL',
        'int_esmil_1': 'Inteligencia ESMIL 1', 'int_esmil_2': 'Inteligencia ESMIL 2', 'int_esmil_3': 'Inteligencia ESMIL 3 (Mixto)', 
        'int_esmil_4': 'Inteligencia ESMIL 4', 'int_esmil_5': 'Inteligencia ESMIL 5', 'int_esmil_6': 'Inteligencia ESMIL 6'
    };
    
    const ordenGeneralPolicia = ['sociales', 'matematicas', 'lengua', 'ingles'];
    const ordenGeneralEsmil = ['sociales_esmil', 'matematicas_esmil', 'lengua_esmil', 'ingles_esmil'];

    // --- INICIO (INIT) ---
    async function init() {
        const params = new URLSearchParams(window.location.search);
        const materiaKey = params.get('materia') || 'sociales';
        const title = materias[materiaKey] || 'Simulador';
        
        // Llenar datos del Lobby
        if(document.getElementById('lobby-titulo-materia')) document.getElementById('lobby-titulo-materia').textContent = title.toUpperCase();
        if(document.getElementById('lobby-materia')) document.getElementById('lobby-materia').textContent = title;

        let fetchUrl = '';
        
        // DETECTAR MODO
        if (materiaKey === 'int_esmil_3') { modeType = 'multi_phase'; fetchUrl = 'DATA/3/3.json'; timeLeft = 3600; } 
        else if (materiaKey === 'int_esmil_2') { modeType = 'table_img'; carpetaEspecialID = '2'; fetchUrl = 'DATA/2/2.json'; timeLeft = 3600; }
        else if (materiaKey.startsWith('int_esmil_')) { modeType = 'normal'; carpetaEspecialID = materiaKey.split('_')[2]; fetchUrl = `DATA/${carpetaEspecialID}/${carpetaEspecialID}.json`; timeLeft = 3600; } 
        else if (materiaKey.includes('matematicas')) { timeLeft = 5400; fetchUrl = `DATA/preguntas_${materiaKey}.json`; }
        else if (materiaKey.includes('general')) { timeLeft = 10800; fetchUrl = `DATA/preguntas_${materiaKey}.json`; }
        else { timeLeft = 3600; fetchUrl = `DATA/preguntas_${materiaKey}.json`; }

        if(document.getElementById('lobby-tiempo')) document.getElementById('lobby-tiempo').textContent = Math.floor(timeLeft/60) + " Min";

        try {
            let filesToLoad = [];
            if (materiaKey.startsWith('int_esmil_')) filesToLoad = [fetchUrl];
            else if (materiaKey === 'general') filesToLoad = ordenGeneralPolicia.map(m => `DATA/preguntas_${m}.json`);
            else if (materiaKey === 'general_esmil') filesToLoad = ordenGeneralEsmil.map(m => `DATA/preguntas_${m}.json`);
            else filesToLoad = [fetchUrl];

            const promises = filesToLoad.map(url => fetch(url).then(r => r.ok ? r.json() : null));
            const results = await Promise.all(promises);
            
            // PROCESAR DATOS SEGÚN MODO
            if (modeType === 'multi_phase') {
                const data = results[0];
                if (!data) throw new Error("Datos vacíos");
                phase1Data = data.parte1;
                phase2Blocks = data.parte2_bloques.map(b => { b.imagen_bloque = `DATA/3/IMAGES/${b.imagen_bloque}`; return b; });
                questions = new Array(phase1Data.length + 20); // Dummy array para contar length
            } 
            else if (modeType === 'table_img') {
                let allQ = []; results.forEach(d => { if(d) allQ = allQ.concat(d); });
                questions = allQ.map(q => {
                    if(q.imagen_pregunta && !q.imagen_pregunta.includes('DATA')) q.imagen_pregunta = `DATA/2/IMAGES/${q.imagen_pregunta}`;
                    q.opciones = q.opciones.map(op => (!op.includes('DATA')) ? `DATA/2/IMAGES/${op}` : op);
                    return q;
                });
            }
            else { // NORMAL
                let allQ = []; results.forEach(d => { if(d) allQ = allQ.concat(d); });
                questions = allQ;
                if (materiaKey.startsWith('int_esmil_')) {
                    questions = questions.map(q => {
                        if (q.imagen) q.imagen = `DATA/${carpetaEspecialID}/IMAGES/${q.imagen.split('/').pop()}`;
                        return q;
                    }).sort(() => 0.5 - Math.random());
                } else {
                    questions = questions.sort(() => 0.5 - Math.random());
                    if (!materiaKey.includes('general') && !materiaKey.startsWith('ppnn')) questions = questions.slice(0, 50);
                }
            }

            if(document.getElementById('lobby-preguntas')) document.getElementById('lobby-preguntas').textContent = questions.length;
            
            // Habilitar botón
            btnStart.disabled = false;
            btnStart.innerHTML = 'COMENZAR TEST';
            btnStart.onclick = () => {
                if (modeType === 'multi_phase') startPhase1();
                else if (modeType === 'table_img') startTableImgQuiz();
                else startQuiz();
            };

        } catch (e) { 
            console.error(e);
            btnStart.innerHTML = "ERROR DE CARGA";
            btnStart.style.background = "#c0392b";
        }
    }

    // --- ARRANQUE DE MODOS ---
    function startQuiz() { 
        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'grid'; // Grid para ver el contenido normal
        userAnswers = new Array(questions.length).fill(null);
        renderNav(); showQ(0); startTimer();
    }

    function startPhase1() {
        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'block'; 
        let html = `<div class="full-width-container"><h2>VOCABULARIO</h2><div class="table-responsive-wrapper"><table class="vocab-table"><thead><tr><th>#</th><th>PALABRA</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>`;
        phase1Data.forEach((q, i) => {
            html += `<tr id="row-p1-${i}"><td><strong>${i+1}</strong></td><td>${q.palabra}</td>${q.opciones.map(op => `<td class="vocab-option-cell" onclick="selectPhase1(${i}, '${op}', this)">${op}</td>`).join('')}</tr>`;
        });
        html += `</tbody></table></div><button class="btn-finish-table" onclick="goToPhase2()">SIGUIENTE SECCIÓN</button></div>`;
        simuladorContainer.innerHTML = html;
        startTimer();
    }

    function startTableImgQuiz() {
        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'block'; 
        let html = `<div class="full-width-container"><h2>RAZONAMIENTO ABSTRACTO</h2><div class="table-responsive-wrapper"><table class="vocab-table"><thead><tr><th>#</th><th>FIGURA</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr></thead><tbody>`;
        questions.forEach((q, i) => {
            html += `<tr id="row-timg-${i}"><td><strong>${q.id}</strong></td><td><img src="${q.imagen_pregunta}" style="max-width:80px;"></td>${q.opciones.map((opImg, idx) => `<td class="img-table-cell" onclick="selectImgCell(${i}, ${idx}, this)"><img src="${opImg}" style="max-width:50px;"></td>`).join('')}</tr>`;
        });
        html += `</tbody></table></div><button class="btn-finish-table" id="btn-trigger-modal-custom">TERMINAR</button></div>`;
        simuladorContainer.innerHTML = html;
        startTimer();
        
        // Evento manual para el botón generado dinámicamente
        setTimeout(() => {
            const btnCustom = document.getElementById('btn-trigger-modal-custom');
            if(btnCustom) btnCustom.onclick = openModal;
        }, 500);
    }

    // --- LÓGICA PREGUNTAS NORMALES ---
    function showQ(idx) {
        const q = questions[idx];
        document.getElementById('pregunta-numero').textContent = `Pregunta ${idx+1}`;
        document.getElementById('pregunta-texto').innerHTML = q.pregunta ? q.pregunta.replace(/\n/g, '<br>') : '';
        document.getElementById('q-image-container').innerHTML = q.imagen ? `<img src="${q.imagen}" style="max-width:100%; border-radius:10px;">` : '';
        const opts = document.getElementById('opciones-container'); opts.innerHTML = '';
        if(q.opciones) q.opciones.forEach(op => {
            const btn = document.createElement('button'); btn.className = 'opcion-btn';
            if(userAnswers[idx] === op) btn.classList.add('selected');
            btn.textContent = op;
            btn.onclick = () => { userAnswers[idx] = op; renderNav(); showQ(idx); };
            opts.appendChild(btn);
        });
        
        // Botón Siguiente
        const btnNext = document.getElementById('siguiente-btn');
        btnNext.textContent = idx === questions.length - 1 ? "FINALIZAR" : "SIGUIENTE";
        btnNext.onclick = () => idx < questions.length - 1 ? showQ(idx + 1) : openModal();
    }

    function renderNav() {
        const nav = document.getElementById('navegador-preguntas'); nav.innerHTML = '';
        questions.forEach((_, i) => { 
            const b = document.createElement('button'); b.className = 'nav-dot'; b.textContent = i + 1;
            if(userAnswers[i]) b.classList.add('answered');
            b.onclick = () => showQ(i);
            nav.appendChild(b); 
        });
    }

    function startTimer(cb) {
        timerInterval = setInterval(() => {
            timeLeft--;
            const el = document.getElementById('cronometro');
            if(el) el.textContent = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`;
            if(timeLeft<=0) finishRouter();
        }, 1000);
    }

    // --- HELPERS GLOBALES ---
    window.selectPhase1 = (i,v,e) => { tableAnswersText[i]=v; e.parentElement.querySelectorAll('.vocab-option-cell').forEach(c=>c.classList.remove('vocab-selected')); e.classList.add('vocab-selected'); };
    window.goToPhase2 = () => { window.scrollTo(0,0); startPhase2(); };
    window.selectPhase2 = (q,v,e) => { 
        let arr = tableAnswersImg[q] || [];
        if(arr.includes(v)) { arr=arr.filter(x=>x!==v); e.classList.remove('opt-selected'); } else { arr.push(v); e.classList.add('opt-selected'); }
        tableAnswersImg[q] = arr; 
    };
    window.selectImgCell = (i,v,e) => { tableAnswersImg[i]=v; e.parentElement.querySelectorAll('.img-table-cell').forEach(c=>c.classList.remove('img-selected')); e.classList.add('img-selected'); };

    function startPhase2() {
        let html = `<div class="full-width-container"><h2>ABSTRACTO</h2>`;
        phase2Blocks.forEach((bloque) => {
            html += `<div class="block-container"><img src="${bloque.imagen_bloque}" style="max-width:100%;"><table class="block-table"><thead><tr><th>#</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr></thead><tbody>`;
            for (let q = bloque.rango_inicio; q <= bloque.rango_fin; q++) {
                html += `<tr><td><strong>${q}</strong></td><td class="opt-cell" onclick="selectPhase2(${q},0,this)">A</td><td class="opt-cell" onclick="selectPhase2(${q},1,this)">B</td><td class="opt-cell" onclick="selectPhase2(${q},2,this)">C</td><td class="opt-cell" onclick="selectPhase2(${q},3,this)">D</td><td class="opt-cell" onclick="selectPhase2(${q},4,this)">E</td><td class="opt-cell" onclick="selectPhase2(${q},5,this)">F</td></tr>`;
            }
            html += `</tbody></table></div>`;
        });
        html += `<button class="btn-finish-table" id="btn-trigger-modal-custom2">TERMINAR EXAMEN</button></div>`;
        simuladorContainer.innerHTML = html;
        setTimeout(() => { document.getElementById('btn-trigger-modal-custom2').onclick = openModal; }, 500);
    }

    // --- SISTEMA DE FINALIZACIÓN (ROBUSTO) ---
    
    function openModal() {
        document.getElementById('modal-overlay').style.display = 'flex';
    }

    // ESTA ES LA FUNCIÓN MAESTRA QUE DECIDE CÓMO TERMINAR
    function finishRouter() {
        console.log("Finalizando... Modo:", modeType);
        document.getElementById('modal-overlay').style.display = 'none';
        clearInterval(timerInterval);
        
        simuladorContainer.style.display = 'none';
        resultadosContainer.style.display = 'block';

        if (modeType === 'multi_phase') finishMultiPhase();
        else if (modeType === 'table_img') finishTableImg();
        else finishNormal();
    }

    function finishNormal() {
        let ok = 0; questions.forEach((q, i) => { if(userAnswers[i] === q.respuesta) ok++; });
        showStats(ok, questions.length);
        
        let html = '';
        questions.forEach((q, i) => {
            const correct = userAnswers[i] === q.respuesta;
            html += `<div style="border-bottom:1px solid #eee; padding:10px;"><p><strong>${i+1}. ${q.pregunta||''}</strong></p>${q.imagen?`<img src="${q.imagen}" width="100">`:''}<p>Tuya: <span style="color:${correct?'green':'red'}">${userAnswers[i]||'--'}</span> Correcta: <span style="color:green">${q.respuesta}</span></p></div>`;
        });
        document.getElementById('revision-container').innerHTML = html;
    }

    function finishMultiPhase() {
        let ok = 0;
        phase1Data.forEach((q, i) => { if(tableAnswersText[i] === q.respuesta) ok++; });
        phase2Blocks.forEach(b => {
            b.respuestas_bloque.forEach((ans, i) => {
                const qNum = b.rango_inicio + i;
                const userArr = tableAnswersImg[qNum] || [];
                if(JSON.stringify(userArr.sort()) === JSON.stringify(ans.sort())) ok++;
            });
        });
        showStats(ok, questions.length); // questions.length se ajustó en init
    }

    function finishTableImg() {
        let ok = 0;
        questions.forEach((q, i) => { if(tableAnswersImg[i] === q.respuesta_index) ok++; });
        showStats(ok, questions.length);
    }

    function showStats(ok, total) {
        const score = Math.round((ok * 1000) / total);
        document.getElementById('puntaje-final').textContent = score;
        document.getElementById('stats-correctas').textContent = ok;
        document.getElementById('stats-incorrectas').textContent = total - ok;
        saveResult(score, total);
    }

    async function saveResult(score, total) {
        const user = JSON.parse(sessionStorage.getItem('userInfo'));
        const materiaTitle = materias[new URLSearchParams(window.location.search).get('materia')] || 'Desconocido';
        if(user) {
            try { await simuladorDB.from('resultados').insert([{ usuario_id: user.usuario, usuario_nombre: user.nombre, materia: materiaTitle, puntaje: score, total_preguntas: total, ciudad: user.ciudad }]); } 
            catch(e) { console.error("Error save:", e); }
        }
    }

    // --- EVENTOS GLOBALES ---
    const btnTerminarNormal = document.getElementById('terminar-intento-btn');
    if(btnTerminarNormal) btnTerminarNormal.onclick = openModal;

    // AQUÍ ESTABA EL PROBLEMA: Conectamos el botón "Sí, Terminar" al Router
    const btnConfirm = document.getElementById('confirmar-modal-btn');
    if(btnConfirm) btnConfirm.onclick = finishRouter;

    const btnCancel = document.getElementById('cancelar-modal-btn');
    if(btnCancel) btnCancel.onclick = () => document.getElementById('modal-overlay').style.display = 'none';

    document.getElementById('retry-btn').onclick = () => location.reload();
    document.getElementById('reiniciar-btn').onclick = () => location.href='index.html';

    init();
});
