// JS/script-simulador.js - IBARRA (BOTÓN TERMINAR ARREGLADO)

// --- 1. CONEXIÓN SUPABASE IBARRA ---
const simuladorUrl = 'https://dgnfjzzwcdfbauyamutp.supabase.co';
const simuladorKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmZqenp3Y2RmYmF1eWFtdXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTk3ODAsImV4cCI6MjA4MTYzNTc4MH0.upcZkm8dYMOlWrbxEQEraUiNHOWyOOBAAqle8rbesNY';

const simuladorDB = window.supabase.createClient(simuladorUrl, simuladorKey);

document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const lobbyBanner = document.getElementById('lobby-banner');
    const lobbyContainer = document.getElementById('lobby-container');
    const simulador = document.getElementById('simulador-container');
    const resultados = document.getElementById('resultados-container');
    const btnStart = document.getElementById('comenzar-btn');
    const txtTituloMateria = document.getElementById('lobby-titulo-materia');
    const txtMateria = document.getElementById('lobby-materia');
    const txtPreguntas = document.getElementById('lobby-preguntas');
    const txtTiempo = document.getElementById('lobby-tiempo');
    
    // Botón regresar
    const btnBack = document.getElementById('btn-regresar-lobby');
    if(btnBack) btnBack.addEventListener('click', () => window.history.length > 1 ? window.history.back() : window.location.href = 'index.html');

    let questions = [];
    let phase1Data = []; 
    let phase2Blocks = []; 
    let userAnswers = [];
    let tableAnswersText = {}; 
    let tableAnswersImg = {}; 
    let currentIdx = 0;
    let timerInterval;
    let timeLeft = 3600;
    let totalPreguntas = 50;
    let carpetaEspecialID = null;
    
    // VARIABLE CLAVE PARA SABER QUÉ TERMINAR
    let modeType = 'normal'; // 'normal', 'multi_phase', 'table_img'

    const materias = {
        'sociales': 'Ciencias Sociales', 'matematicas': 'Matemáticas y Física', 'lengua': 'Lengua y Literatura', 'ingles': 'Inglés', 'general': 'General (Todas)',
        'inteligencia': 'Inteligencia', 'personalidad': 'Personalidad', 'ppnn1': 'Cuestionario 1 PPNN', 'ppnn2': 'Cuestionario 2 PPNN', 'ppnn3': 'Cuestionario 3 PPNN', 'ppnn4': 'Cuestionario 4 PPNN',
        'sociales_esmil': 'Ciencias Sociales (ESMIL)', 'matematicas_esmil': 'Matemáticas (ESMIL)', 'lengua_esmil': 'Lenguaje (ESMIL)', 'ingles_esmil': 'Inglés (ESMIL)', 'general_esmil': 'General ESMIL',
        'int_esmil_1': 'Inteligencia ESMIL 1', 'int_esmil_2': 'Inteligencia ESMIL 2', 'int_esmil_3': 'Inteligencia ESMIL 3 (Mixto)', 
        'int_esmil_4': 'Inteligencia ESMIL 4', 'int_esmil_5': 'Inteligencia ESMIL 5', 'int_esmil_6': 'Inteligencia ESMIL 6'
    };
    
    const ordenGeneralPolicia = ['sociales', 'matematicas', 'lengua', 'ingles'];
    const ordenGeneralEsmil = ['sociales_esmil', 'matematicas_esmil', 'lengua_esmil', 'ingles_esmil'];

    function showError(msg) {
        console.error(msg);
        btnStart.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${msg}`;
        btnStart.style.background = "#c0392b";
    }

    async function init() {
        const params = new URLSearchParams(window.location.search);
        const materiaKey = params.get('materia') || 'sociales';
        const title = materias[materiaKey] || 'Simulador';
        
        if(txtTituloMateria) txtTituloMateria.textContent = title.toUpperCase();
        if(txtMateria) txtMateria.textContent = title;

        let fetchUrl = '';
        
        // CONFIGURACIÓN DE RUTAS Y MODOS
        if (materiaKey === 'int_esmil_3') {
            modeType = 'multi_phase'; fetchUrl = 'DATA/3/3.json'; timeLeft = 3600;
        } 
        else if (materiaKey === 'int_esmil_2') {
            modeType = 'table_img'; carpetaEspecialID = '2'; fetchUrl = 'DATA/2/2.json'; timeLeft = 3600;
        }
        else if (materiaKey.startsWith('int_esmil_')) {
            modeType = 'normal';
            carpetaEspecialID = materiaKey.split('_')[2]; 
            fetchUrl = `DATA/${carpetaEspecialID}/${carpetaEspecialID}.json`; 
            timeLeft = 3600;
        } 
        else if (materiaKey.includes('matematicas')) { timeLeft = 5400; fetchUrl = `DATA/preguntas_${materiaKey}.json`; }
        else if (materiaKey.includes('general')) { timeLeft = 10800; totalPreguntas = 200; fetchUrl = `DATA/preguntas_${materiaKey}.json`; }
        else { timeLeft = 3600; fetchUrl = `DATA/preguntas_${materiaKey}.json`; }

        if(txtTiempo) txtTiempo.textContent = Math.floor(timeLeft/60) + " Min";

        try {
            let filesToLoad = [];
            if (materiaKey.startsWith('int_esmil_')) filesToLoad = [fetchUrl];
            else if (materiaKey === 'general') filesToLoad = ordenGeneralPolicia.map(m => `DATA/preguntas_${m}.json`);
            else if (materiaKey === 'general_esmil') filesToLoad = ordenGeneralEsmil.map(m => `DATA/preguntas_${m}.json`);
            else filesToLoad = [fetchUrl];

            const promises = filesToLoad.map(url => fetch(url).then(r => r.ok ? r.json() : null));
            const results = await Promise.all(promises);
            
            // PROCESAMIENTO
            if (modeType === 'multi_phase') {
                const data = results[0];
                if (!data || !data.parte1 || !data.parte2_bloques) throw new Error("JSON Inválido Sim 3");
                phase1Data = data.parte1;
                phase2Blocks = data.parte2_bloques.map(b => {
                    b.imagen_bloque = `DATA/3/IMAGES/${b.imagen_bloque}`; 
                    return b;
                });
                totalPreguntas = phase1Data.length + 20; 
            } 
            else if (modeType === 'table_img') {
                let allQ = []; results.forEach(d => { if(d) allQ = allQ.concat(d); });
                questions = allQ.map(q => {
                    if(q.imagen_pregunta && !q.imagen_pregunta.includes('DATA')) q.imagen_pregunta = `DATA/2/IMAGES/${q.imagen_pregunta}`;
                    q.opciones = q.opciones.map(op => (!op.includes('DATA')) ? `DATA/2/IMAGES/${op}` : op);
                    return q;
                });
                totalPreguntas = questions.length;
            }
            else {
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
                totalPreguntas = questions.length;
            }

            if(txtPreguntas) txtPreguntas.textContent = totalPreguntas;

            if (modeType !== 'multi_phase' && questions.some(q => q.imagen || q.imagen_pregunta)) {
                btnStart.innerHTML = "CARGANDO...";
                await Promise.race([preloadImages(questions), new Promise(r => setTimeout(r, 2000))]);
            }
            
            btnStart.disabled = false;
            btnStart.innerHTML = 'COMENZAR TEST';
            
            btnStart.onclick = () => {
                if (modeType === 'multi_phase') startPhase1();
                else if (modeType === 'table_img') startTableImgQuiz();
                else startQuiz();
            };

        } catch (e) { showError(e.message); }
    }

    async function preloadImages(list) {
        let imgsToLoad = [];
        list.forEach(q => {
            if(q.imagen) imgsToLoad.push(q.imagen);
            if(q.imagen_pregunta) imgsToLoad.push(q.imagen_pregunta);
            if(q.opciones && Array.isArray(q.opciones) && q.opciones[0].includes && q.opciones[0].includes('DATA')) imgsToLoad = imgsToLoad.concat(q.opciones);
        });
        await Promise.all(imgsToLoad.map(src => new Promise(resolve => {
            const i = new Image(); i.src = src; i.onload = resolve; i.onerror = resolve;
        })));
    }

    // --- FUNCIONES DE INICIO ---
    function startQuiz() { 
        lobbyBanner.style.display = 'none'; lobbyContainer.style.display = 'none';
        simulador.style.display = 'grid'; simulador.className = 'quiz-layout';
        userAnswers = new Array(questions.length).fill(null);
        renderNav(); showQ(0); startTimer(() => finish());
    }

    function startPhase1() {
        lobbyBanner.style.display = 'none'; lobbyContainer.style.display = 'none';
        simulador.style.display = 'block'; simulador.className = ''; 
        let html = `<div class="full-width-container"><div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center;"><h2>VOCABULARIO</h2></div><div class="table-responsive-wrapper"><table class="vocab-table"><thead><tr><th style="width:50px;">#</th><th>PALABRA</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>`;
        phase1Data.forEach((q, i) => {
            html += `<tr id="row-p1-${i}"><td><strong>${i+1}</strong></td><td class="vocab-word-cell">${q.palabra}</td>
            ${q.opciones.map(op => `<td class="vocab-option-cell" onclick="selectPhase1(${i}, '${op}', this)">${op}</td>`).join('')}</tr>`;
        });
        html += `</tbody></table></div><button class="btn-finish-table" onclick="goToPhase2()">SIGUIENTE SECCIÓN</button></div>`;
        simulador.innerHTML = html;
        startTimer(() => finishMultiPhase());
    }

    function startTableImgQuiz() {
        lobbyBanner.style.display = 'none'; lobbyContainer.style.display = 'none';
        simulador.style.display = 'block'; simulador.className = ''; 
        let html = `<div class="full-width-container"><div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center;"><h2>RAZONAMIENTO ABSTRACTO</h2></div><div class="table-responsive-wrapper"><table class="vocab-table"><thead><tr><th style="width:40px;">#</th><th>FIGURA</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr></thead><tbody>`;
        questions.forEach((q, i) => {
            html += `<tr id="row-timg-${i}"><td><strong>${q.id}</strong></td><td class="question-img-cell"><img src="${q.imagen_pregunta}" style="max-width:80px;"></td>
            ${q.opciones.map((opImg, idx) => `<td class="img-table-cell" onclick="selectImgCell(${i}, ${idx}, this)"><img src="${opImg}" style="max-width:50px;"></td>`).join('')}</tr>`;
        });
        html += `</tbody></table></div><button class="btn-finish-table" id="btn-trigger-modal">TERMINAR</button></div>`;
        simulador.innerHTML = html;
        startTimer(() => finishTableImg());
        
        // Modal Event Específico para este modo
        document.getElementById('btn-trigger-modal').onclick = () => {
            let faltantes = 0; questions.forEach((_, i) => { if(tableAnswersImg[i] === undefined) faltantes++; });
            document.getElementById('modal-mensaje').textContent = `Faltan ${faltantes} preguntas.`;
            document.getElementById('modal-overlay').style.display = 'flex';
        };
    }

    // --- LÓGICA DE PREGUNTAS (NORMAL) ---
    function showQ(idx) {
        currentIdx = idx;
        const q = questions[idx];
        document.getElementById('pregunta-numero').textContent = `Pregunta ${idx+1}`;
        document.getElementById('pregunta-texto').innerHTML = q.pregunta ? q.pregunta.replace(/\n/g, '<br>') : '';
        document.getElementById('q-image-container').innerHTML = q.imagen ? `<img src="${q.imagen}" style="max-width:100%; border-radius:10px;">` : '';
        
        const opts = document.getElementById('opciones-container'); opts.innerHTML = '';
        if(q.opciones) q.opciones.forEach(op => {
            const btn = document.createElement('button'); btn.className = 'opcion-btn';
            if(userAnswers[idx] === op) btn.classList.add('selected');
            btn.textContent = op;
            btn.onclick = () => {
                userAnswers[idx] = op;
                Array.from(opts.children).forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                updateNavStatus(idx, true);
            };
            opts.appendChild(btn);
        });
        updateNavStatus(idx, false);
        const btnNext = document.getElementById('siguiente-btn');
        btnNext.textContent = idx === questions.length - 1 ? "FINALIZAR" : "SIGUIENTE";
        btnNext.onclick = () => idx < questions.length - 1 ? showQ(idx + 1) : document.getElementById('terminar-intento-btn').click();
    }

    function renderNav() {
        const nav = document.getElementById('navegador-preguntas'); nav.innerHTML = '';
        questions.forEach((_, i) => { 
            const b = document.createElement('button'); 
            b.className = 'nav-dot'; 
            b.textContent = i + 1;
            b.onclick = () => showQ(i);
            nav.appendChild(b); 
        });
    }

    function updateNavStatus(idx, isAnswered) {
        const nav = document.getElementById('navegador-preguntas');
        if(!nav || !nav.children[idx]) return;
        Array.from(nav.children).forEach(b => b.style.borderColor = '#ddd');
        nav.children[idx].style.borderColor = '#d32f2f'; 
        if(isAnswered) nav.children[idx].classList.add('answered');
    }

    // --- UTILIDADES ---
    function startTimer(callback) {
        timerInterval = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById('cronometro');
            if(timerEl) timerEl.textContent = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`;
            if(timeLeft<=0) callback();
        }, 1000);
        
        if(!document.querySelector('.timer-box')) {
            const floatTimer = document.createElement('div');
            floatTimer.className = 'timer-box';
            floatTimer.innerHTML = `<i class="fas fa-clock"></i> <span id="cronometro">${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}</span>`;
            document.body.appendChild(floatTimer);
        }
    }

    // --- SELECCIONES FASES ---
    window.selectPhase1 = (idx, val, el) => {
        tableAnswersText[idx] = val;
        const row = document.getElementById(`row-p1-${idx}`);
        for(let c of row.getElementsByClassName('vocab-option-cell')) c.classList.remove('vocab-selected');
        el.classList.add('vocab-selected');
    };
    window.goToPhase2 = () => { window.scrollTo(0,0); startPhase2(); };

    window.selectPhase2 = (qNum, valIdx, el) => {
        let currentAns = tableAnswersImg[qNum] || [];
        if (currentAns.includes(valIdx)) { currentAns = currentAns.filter(v => v !== valIdx); el.classList.remove('opt-selected'); } 
        else { currentAns.push(valIdx); el.classList.add('opt-selected'); }
        tableAnswersImg[qNum] = currentAns;
    };

    window.selectImgCell = (idx, valIdx, el) => {
        tableAnswersImg[idx] = valIdx;
        const row = document.getElementById(`row-timg-${idx}`);
        for(let c of row.getElementsByClassName('img-table-cell')) c.classList.remove('img-selected');
        el.classList.add('img-selected');
    };

    // --- FINALIZADORES (FUNCIONES QUE GUARDAN Y MUESTRAN RESULTADOS) ---
    async function finish() {
        clearInterval(timerInterval);
        
        // AQUÍ ESTABA EL ERROR ANTES: Verificamos si existe el elemento antes de ocultarlo
        const quizLayout = document.querySelector('.quiz-layout');
        if (quizLayout) quizLayout.style.display = 'none';
        else simulador.style.display = 'none'; // Si no es quiz-layout, ocultamos el contenedor genérico

        resultados.style.display = 'block';
        let ok = 0; questions.forEach((q, i) => { if(userAnswers[i] === q.respuesta) ok++; });
        const score = Math.round((ok * 1000) / questions.length);
        showStats(ok, questions.length, score);
        
        let revHTML = '';
        questions.forEach((q, i) => {
            const correct = userAnswers[i] === q.respuesta;
            revHTML += `<div style="border-bottom:1px solid #eee; padding:15px; text-align:left;">
                <p><strong>${i+1}. ${q.pregunta || 'Pregunta imagen'}</strong></p>
                ${q.imagen ? `<img src="${q.imagen}" style="max-width:150px;">` : ''}
                <p>Tuya: <span style="color:${correct?'green':'red'}">${userAnswers[i]||'---'}</span></p>
                ${!correct ? `<p style="color:green">Correcta: <strong>${q.respuesta}</strong></p>` : ''}
            </div>`;
        });
        document.getElementById('revision-container').innerHTML = revHTML;
        saveResult(score, questions.length, materias[new URLSearchParams(window.location.search).get('materia')]);
    }

    window.finishMultiPhase = async () => {
        clearInterval(timerInterval);
        simulador.style.display = 'none'; resultados.style.display = 'block';
        // ... (Lógica de cálculo MultiFase) ...
        let ok1 = 0, ok2 = 0;
        let revHTML = '<h3 style="background:#eee; padding:10px; border-radius:8px; margin-top:30px;">FASE 1</h3>';
        phase1Data.forEach((q, i) => {
            const userAns = tableAnswersText[i];
            if (userAns === q.respuesta) ok1++;
            revHTML += `<div style="border-bottom:1px solid #eee; padding:15px; text-align:left;"><p><strong>${i+1}. ${q.palabra}</strong></p><p>Respuesta: <strong>${userAns||'--'}</strong> <span style="color:green">(Correcta: ${q.respuesta})</span></p></div>`;
        });
        revHTML += '<h3 style="background:#eee; padding:10px; border-radius:8px; margin-top:30px;">FASE 2</h3>';
        const letras = ['A','B','C','D','E','F'];
        phase2Blocks.forEach((bloque, bIdx) => {
            revHTML += `<div style="margin-top:20px; border:1px solid #eee; padding:10px;"><div style="text-align:center;"><img src="${bloque.imagen_bloque}" style="max-width:100%;"></div>`;
            bloque.respuestas_bloque.forEach((correctArr, i) => {
                const qNum = bloque.rango_inicio + i;
                const userArr = tableAnswersImg[qNum] || [];
                const esCorrecto = (userArr.length === correctArr.length) && userArr.every(val => correctArr.includes(val));
                if (esCorrecto) ok2++;
                revHTML += `<div style="padding:5px;"><strong>P${qNum}:</strong> Tuya: ${userArr.map(x=>letras[x]).join('')} | Correcta: ${correctArr.map(x=>letras[x]).join('')}</div>`;
            });
            revHTML += `</div>`;
        });
        const totalQ = phase1Data.length + 20;
        const score = Math.round(((ok1+ok2) * 1000) / totalQ);
        showStats(ok1+ok2, totalQ, score);
        document.getElementById('revision-container').innerHTML = revHTML;
        saveResult(score, totalQ, 'Inteligencia ESMIL 3 (Mixto)');
    };

    window.finishTableImg = async () => {
        clearInterval(timerInterval);
        simulador.style.display = 'none'; resultados.style.display = 'block';
        let ok = 0; let revHTML = '';
        questions.forEach((q, i) => {
            const userAns = tableAnswersImg[i];
            const correctAns = q.respuesta_index;
            if(userAns === correctAns) ok++;
            revHTML += `<div style="border-bottom:1px solid #eee; padding:15px; text-align:left;">
                <p><strong>Pregunta ${q.id}</strong></p>
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${q.imagen_pregunta}" style="max-width:50px;">
                    <span>Tu respuesta: <strong>${userAns!==undefined ? String.fromCharCode(65+userAns) : '--'}</strong></span>
                    <span style="color:green;">Correcta: ${String.fromCharCode(65+correctAns)}</span>
                </div>
            </div>`;
        });
        const score = Math.round((ok * 1000) / questions.length);
        showStats(ok, questions.length, score);
        document.getElementById('revision-container').innerHTML = revHTML;
        saveResult(score, questions.length, materias[new URLSearchParams(window.location.search).get('materia')]);
    };

    function showStats(ok, total, score) {
        document.getElementById('puntaje-final').textContent = score;
        document.getElementById('stats-correctas').textContent = ok;
        document.getElementById('stats-incorrectas').textContent = total - ok;
        document.getElementById('retry-btn').onclick = () => location.reload();
        document.getElementById('reiniciar-btn').onclick = () => location.href='index.html';
    }

    async function saveResult(score, total, title) {
        const userStr = sessionStorage.getItem('userInfo'); 
        if(userStr) {
            const user = JSON.parse(userStr);
            try {
                await simuladorDB.from('resultados').insert([{
                    usuario_id: user.usuario, usuario_nombre: user.nombre, materia: title,
                    puntaje: score, total_preguntas: total, ciudad: user.ciudad
                }]);
            } catch(e) { console.error("Error guardando:", e); }
        }
    }

    // --- MODAL EVENTS (CORREGIDO) ---
    document.getElementById('terminar-intento-btn').onclick = () => {
        let faltan = 0;
        if(modeType === 'normal') faltan = userAnswers.filter(a => a === null).length;
        // Para otros modos se podría calcular diferente, pero por ahora mostramos el modal simple
        document.getElementById('modal-mensaje').textContent = `¿Estás seguro? Faltan ${faltan} preguntas.`;
        document.getElementById('modal-overlay').style.display = 'flex';
    };
    
    // AQUÍ ESTÁ EL CAMBIO CLAVE: Detecta el modo y llama a la función correcta
    document.getElementById('confirmar-modal-btn').onclick = () => { 
        document.getElementById('modal-overlay').style.display='none';
        
        if (modeType === 'multi_phase') {
            finishMultiPhase();
        } else if (modeType === 'table_img') {
            finishTableImg();
        } else {
            finish(); // Modo Normal
        }
    };
    
    document.getElementById('cancelar-modal-btn').onclick = () => document.getElementById('modal-overlay').style.display='none';

    init();
});
