// ─── DATA ───────────────────────────────────────────────
const COLABORADORES_DEFAULT = [
  {nome:"Gabriel Santos",    horario:"08h - 18h",    regiao:"Aracaju",                  almoco:"12:00"},
  {nome:"Michel",            horario:"08h - 18h",    regiao:"Aracaju",                  almoco:"13:12"},
  {nome:"Luan",              horario:"08h - 18h",    regiao:"Aracaju",                  almoco:"11:00"},
  {nome:"Vieira",            horario:"08h - 18h",    regiao:"São Luiz",                 almoco:"13:12"},
  {nome:"Silas",             horario:"08h - 18h",    regiao:"São Luiz",                 almoco:"12:00"},
  {nome:"Pablo Ricardo",     horario:"08h - 14h",    regiao:"São Luiz",                 almoco:"10:30"},
  {nome:"Artur Oliveira",    horario:"08h - 18h",    regiao:"Ipatinga / Teófilo Otoni", almoco:"12:00"},
  {nome:"Lukas Gabriel",     horario:"08h - 18h",    regiao:"Ipatinga / Teófilo Otoni", almoco:"13:12"},
  {nome:"Resende",           horario:"08h - 18h",    regiao:"Ipatinga / Teófilo Otoni", almoco:"11:00"},
  {nome:"Luciano",           horario:"12h - 18h",    regiao:"Ipatinga / Teófilo Otoni", almoco:"15:00"},
  {nome:"Azevedo",           horario:"08h - 18h",    regiao:"Ribeirão Preto",           almoco:"12:00"},
  {nome:"Samuel Shimada",    horario:"08h - 18h",    regiao:"Ribeirão Preto",           almoco:"13:12"},
  {nome:"Assunção",          horario:"08h - 14h",    regiao:"Goiânia",                  almoco:"10:45"},
  {nome:"Matheus Diogo",     horario:"08h - 18h",    regiao:"Goiânia",                  almoco:"12:00"},
  {nome:"Guilherme Ferreira",horario:"12h - 18h",    regiao:"Goiânia",                  almoco:"14:45"},
  {nome:"Glennendy",         horario:"12h - 18h",    regiao:"Juazeiro do Norte",        almoco:"15:30"},
  {nome:"Willy",             horario:"08h - 14h",    regiao:"Juazeiro do Norte",        almoco:"11:30"},
  {nome:"Alvarenga",         horario:"08h - 18h",    regiao:"Cuiabá",                   almoco:"12:00"},
  {nome:"Joadson",           horario:"08h - 18h",    regiao:"Cuiabá",                   almoco:"13:12"},
  {nome:"Firmino",           horario:"14h - 19h",    regiao:"Cuiabá",                   almoco:"15:30"},
  {nome:"Atanael",           horario:"07:30 - 13:30",regiao:"Cuiabá",                   almoco:"10:30"},
];

// Load colaboradores from localStorage or use defaults
let COLABORADORES = JSON.parse(localStorage.getItem('pev_colaboradores') || 'null') || COLABORADORES_DEFAULT.map(c => ({...c}));

function saveColaboradores() {
  localStorage.setItem('pev_colaboradores', JSON.stringify(COLABORADORES));
  syncColaboradoresHermes();
}

async function syncColaboradoresHermes() {
  try {
    await fetch('/api/hermes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'sync-colaboradores', colaboradores: COLABORADORES })
    });
    console.log('[PEV] Colaboradores sincronizados com o Hermes');
  } catch (e) {
    console.warn('[PEV] Sync com Hermes falhou:', e.message);
  }
}

// ─── STATE ──────────────────────────────────────────────
let escalaState = {};
let almocoState = {};

function initState() {
  COLABORADORES.forEach(c => {
    if (!escalaState[c.nome]) escalaState[c.nome] = { status: 'none', obs: '' };
    if (!almocoState[c.nome]) almocoState[c.nome] = { horario: c.almoco, done: false };
  });
}
initState();

// ─── DATE UTILS ─────────────────────────────────────────
const DIAS = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

let currentDate = today();
document.getElementById('date-input').value = currentDate;
document.getElementById('date-input').addEventListener('change', e => {
  currentDate = e.target.value;
  updateDateDisplays();
  renderEscalaOutput();
  generateAlmoco();
});

function parseDateDisplay(iso) {
  const [y,m,d] = iso.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  const dia = String(d).padStart(2,'0');
  const mes = String(m).padStart(2,'0');
  return { label: `${dia}/${mes}/${y} – <span>${DIAS[dt.getDay()]}</span>`, dt };
}

function updateDateDisplays() {
  const { label } = parseDateDisplay(currentDate);
  document.getElementById('escala-date-display').innerHTML = label;
  document.getElementById('almoco-date-display').innerHTML = label;
}
updateDateDisplays();

// ─── TABS ───────────────────────────────────────────────
function goTab(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
}

// ─── AVATAR COLORS ──────────────────────────────────────
const AVATAR_COLORS = [
  ['#3b3060','#afa9ec'],['#063344','#5dcaa5'],['#3f1f18','#f08585'],
  ['#1a2540','#60a5fa'],['#2a1040','#c084fc'],['#1a3020','#4ade80'],
  ['#3a2510','#fb923c'],['#2a1030','#f472b6'],['#0a2a2a','#2dd4bf'],
  ['#302010','#fbbf24'],['#1a1a3a','#818cf8'],['#2a2010','#a3e635'],
];
function avatarColor(nome) {
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(nome) {
  const p = nome.trim().split(' ');
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

// ─── GROUP BY REGION ────────────────────────────────────
function groupByRegion(list) {
  const map = {};
  list.forEach(c => {
    if (!map[c.regiao]) map[c.regiao] = [];
    map[c.regiao].push(c);
  });
  return map;
}

// ─── PROGRESS ───────────────────────────────────────────
function renderProgress() {
  const total = COLABORADORES.length;
  const withStatus = COLABORADORES.filter(c => escalaState[c.nome]?.status !== 'none').length;
  const pct = total ? Math.round((withStatus / total) * 100) : 0;
  const complete = withStatus === total;

  const fill = document.getElementById('progress-fill');
  const countEl = document.getElementById('progress-count');
  const pendEl = document.getElementById('progress-pending');

  if (fill) {
    fill.style.width = pct + '%';
    fill.className = 'progress-fill' + (complete ? ' complete' : '');
  }
  if (countEl) countEl.innerHTML = `<strong>${withStatus}</strong> / ${total} colaboradores definidos`;
  if (pendEl) {
    const sem = total - withStatus;
    pendEl.textContent = sem > 0 ? `⚠ ${sem} sem status` : '';
    pendEl.style.color = sem > 0 ? 'var(--orange)' : 'var(--green)';
  }
}

// ─── ESCALA RENDER ──────────────────────────────────────
const collapsedRegions = new Set();

function renderEscala() {
  const list = document.getElementById('escala-list');
  list.innerHTML = '';

  const byRegion = groupByRegion(COLABORADORES);

  Object.entries(byRegion).forEach(([reg, cols]) => {
    const isCollapsed = collapsedRegions.has(reg);

    const block = document.createElement('div');
    block.className = 'region-block';

    // count statuses in region
    const regionCounts = { int:0, ext:0, off:0, rod:0 };
    cols.forEach(c => { const s = escalaState[c.nome]?.status; if(s && s !== 'none') regionCounts[s]++; });
    const defined = Object.values(regionCounts).reduce((a,b)=>a+b,0);
    const badgeText = defined === cols.length
      ? `✓ ${cols.length}`
      : `${defined}/${cols.length}`;

    block.innerHTML = `
      <div class="region-sticky-header${isCollapsed ? ' collapsed' : ''}" id="rhdr-${reg.replace(/\s/g,'_')}">
        <div class="region-header-left" onclick="toggleRegion('${reg}')">
          <span class="region-name">${reg}</span>
          <span class="region-badge">${badgeText}</span>
          <span class="region-collapse-icon">▼</span>
        </div>
        <div class="region-mass-btns">
          <button class="mbtn mbtn-int" onclick="massSetRegion('${reg}','int')">Todos Int.</button>
          <button class="mbtn mbtn-ext" onclick="massSetRegion('${reg}','ext')">Todos Ext.</button>
          <button class="mbtn mbtn-off" onclick="massSetRegion('${reg}','off')">Todos OFF</button>
          <button class="mbtn mbtn-rod" onclick="massSetRegion('${reg}','rod')">Rodízio</button>
        </div>
      </div>
      <div class="region-rows${isCollapsed ? ' collapsed' : ''}" id="rrows-${reg.replace(/\s/g,'_')}"></div>
    `;
    list.appendChild(block);

    const rowsContainer = block.querySelector('.region-rows');
    cols.forEach(c => {
      const st = escalaState[c.nome] || { status: 'none', obs: '' };
      const [bg, fg] = avatarColor(c.nome);
      const showObs = st.status === 'int';
      const row = document.createElement('div');
      row.className = 'status-row';
      row.id = 'erow-' + c.nome.replace(/\s/g,'_');
      row.innerHTML = `
        <div class="person-avatar" style="background:${bg};color:${fg}">${initials(c.nome)}</div>
        <div class="status-name">${c.nome}</div>
        <span class="status-horario">${c.horario}</span>
        <input class="obs-input${showObs ? '' : ' hidden'}" id="obs-${c.nome.replace(/\s/g,'_')}"
          placeholder="obs." value="${st.obs}"
          oninput="setObs('${c.nome}', this.value)">
        <div class="status-btns">
          <button class="sbtn${st.status==='int'?' active-int':''}" onclick="setStatus('${c.nome}','int')">Interno</button>
          <button class="sbtn${st.status==='ext'?' active-ext':''}" onclick="setStatus('${c.nome}','ext')">Externo</button>
          <button class="sbtn${st.status==='off'?' active-off':''}" onclick="setStatus('${c.nome}','off')">OFF</button>
          <button class="sbtn${st.status==='rod'?' active-rod':''}" onclick="setStatus('${c.nome}','rod')">Rodízio</button>
        </div>`;
      rowsContainer.appendChild(row);
    });
  });

  renderEscalaStats();
  renderProgress();
  renderEscalaOutput();
}

function toggleRegion(reg) {
  if (collapsedRegions.has(reg)) collapsedRegions.delete(reg);
  else collapsedRegions.add(reg);
  const key = reg.replace(/\s/g,'_');
  document.getElementById('rhdr-' + key)?.classList.toggle('collapsed');
  document.getElementById('rrows-' + key)?.classList.toggle('collapsed');
  // update badge/arrow without full re-render
  const hdr = document.getElementById('rhdr-' + key);
  if (hdr) {
    const collapsed = collapsedRegions.has(reg);
    hdr.className = 'region-sticky-header' + (collapsed ? ' collapsed' : '');
  }
}

function massSetRegion(reg, status) {
  COLABORADORES.filter(c => c.regiao === reg).forEach(c => {
    if (!escalaState[c.nome]) escalaState[c.nome] = { status: 'none', obs: '' };
    escalaState[c.nome].status = status;
  });
  renderEscala();
  showToast(`${reg}: todos → ${status === 'int' ? 'Interno' : status === 'ext' ? 'Externo' : status === 'off' ? 'OFF' : 'Rodízio'}`);
}

function setStatus(nome, status) {
  if (!escalaState[nome]) escalaState[nome] = { status: 'none', obs: '' };
  escalaState[nome].status = (escalaState[nome].status === status) ? 'none' : status;
  renderEscala();
}

function setObs(nome, val) {
  if (!escalaState[nome]) escalaState[nome] = { status: 'none', obs: '' };
  escalaState[nome].obs = val;
  renderEscalaOutput();
}

function renderEscalaStats() {
  const counts = { int: 0, ext: 0, off: 0, rod: 0, none: 0 };
  COLABORADORES.forEach(c => counts[escalaState[c.nome]?.status || 'none']++);
  const stats = document.getElementById('escala-stats');
  stats.innerHTML = `
    <div class="stat-chip" style="background:var(--gold-bg);border-color:var(--gold-border);color:var(--gold)">${counts.int} Internos</div>
    <div class="stat-chip" style="background:var(--blue-bg);border-color:var(--blue-border);color:var(--blue)">${counts.ext} Externos</div>
    <div class="stat-chip" style="background:var(--red-bg);border-color:var(--red-border);color:var(--red)">${counts.off} OFF</div>
    <div class="stat-chip" style="background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple)">${counts.rod} Rodízio</div>
    <div class="stat-chip" style="background:var(--surface2);border-color:var(--border);color:var(--text-muted)">${counts.none} sem status</div>
  `;
}

function renderEscalaOutput() {
  const { dt } = parseDateDisplay(currentDate);
  const dia = String(dt.getDate()).padStart(2,'0');
  const mes = String(dt.getMonth()+1).padStart(2,'0');
  const ano = dt.getFullYear();
  const diaNome = DIAS[dt.getDay()];

  const internos = COLABORADORES.filter(c => escalaState[c.nome]?.status === 'int');
  const externos = COLABORADORES.filter(c => escalaState[c.nome]?.status === 'ext');
  const offs     = COLABORADORES.filter(c => escalaState[c.nome]?.status === 'off');
  const rodizio  = COLABORADORES.filter(c => escalaState[c.nome]?.status === 'rod');

  if (!internos.length && !externos.length && !offs.length && !rodizio.length) {
    document.getElementById('escala-output').innerHTML = '<em>Configure a escala acima para gerar a mensagem...</em>';
    return;
  }

  let txt = `*${dia}/${mes}/${ano} - ${diaNome}*\n`;

  if (internos.length) {
    txt += `\nInternos:\n`;
    Object.entries(groupByRegion(internos)).forEach(([reg, cols]) => {
      txt += `  ${reg}:\n`;
      cols.forEach(c => {
        const obs = escalaState[c.nome]?.obs;
        txt += `  ${c.horario} - ${c.nome}${obs ? ` (${obs})` : ''}\n`;
      });
    });
  }
  if (externos.length) {
    txt += `\nExternos:\n`;
    Object.entries(groupByRegion(externos)).forEach(([reg, cols]) => {
      txt += `  ${reg}:\n`;
      cols.forEach(c => txt += `  ${c.horario} - ${c.nome}\n`);
    });
  }
  if (offs.length) {
    txt += `\nOFF:\n`;
    offs.forEach(c => txt += `${c.nome}\n`);
  }
  if (rodizio.length) {
    txt += `\nRodizio/Demanda específica:\n`;
    rodizio.forEach(c => txt += `${c.horario} - ${c.nome}\n`);
  }

  document.getElementById('escala-output').textContent = txt.trim();
}

function copyEscala() {
  const txt = document.getElementById('escala-output').textContent;
  if (!txt || txt.includes('Configure')) return showToast('Nada para copiar ainda!');
  copyText(txt, 'Escala copiada!');
}

function clearEscala() {
  showConfirm(
    'Limpar escala?',
    'Todos os status e observações serão apagados.',
    () => {
      COLABORADORES.forEach(c => escalaState[c.nome] = { status: 'none', obs: '' });
      renderEscala();
      showToast('Escala limpa!');
    }
  );
}

// ─── ALMOÇO RENDER ──────────────────────────────────────
function renderAlmocoList() {
  const list = document.getElementById('almoco-list');
  list.innerHTML = '';

  Object.entries(groupByRegion(COLABORADORES)).forEach(([reg, cols]) => {
    const label = document.createElement('div');
    label.className = 'sec-label';
    label.textContent = reg;
    list.appendChild(label);

    cols.forEach(c => {
      const st = almocoState[c.nome] || { horario: c.almoco, done: false };
      const [bg, fg] = avatarColor(c.nome);
      const row = document.createElement('div');
      row.className = 'almoco-row' + (st.done ? ' done-row' : '');
      row.id = 'arow-' + c.nome.replace(/\s/g,'_');
      row.innerHTML = `
        <div class="person-avatar" style="background:${bg};color:${fg};width:28px;height:28px;font-size:10px">${initials(c.nome)}</div>
        <div class="almoco-name">${c.nome}</div>
        <input class="time-input" type="time" value="${st.horario}"
          onchange="setAlmocoTime('${c.nome}', this.value)">
        <button class="almoco-check${st.done?' done':''}" onclick="toggleAlmoco('${c.nome}')" title="Marcar saída">
          ${st.done ? '✓' : ''}
        </button>`;
      list.appendChild(row);
    });
  });
}

function setAlmocoTime(nome, val) {
  if (!almocoState[nome]) almocoState[nome] = { horario: val, done: false };
  almocoState[nome].horario = val;
  generateAlmoco();
}

function toggleAlmoco(nome) {
  if (!almocoState[nome]) almocoState[nome] = { horario: '12:00', done: false };
  almocoState[nome].done = !almocoState[nome].done;
  const row = document.getElementById('arow-' + nome.replace(/\s/g,'_'));
  const btn = row.querySelector('.almoco-check');
  if (almocoState[nome].done) {
    row.classList.add('done-row'); btn.classList.add('done'); btn.textContent = '✓';
  } else {
    row.classList.remove('done-row'); btn.classList.remove('done'); btn.textContent = '';
  }
  generateAlmoco();
}

function generateAlmoco() {
  const { dt } = parseDateDisplay(currentDate);
  const dia = String(dt.getDate()).padStart(2,'0');
  const mes = String(dt.getMonth()+1).padStart(2,'0');
  const ano = dt.getFullYear();
  const diaNome = DIAS[dt.getDay()];

  const ativos = COLABORADORES.filter(c => almocoState[c.nome]?.done);
  if (!ativos.length) {
    document.getElementById('almoco-output').innerHTML = '<em>Marque os almoços acima para gerar a mensagem...</em>';
    return;
  }

  let txt = `*Almoço – ${dia}/${mes}/${ano} (${diaNome})*\n`;
  Object.entries(groupByRegion(ativos)).forEach(([reg, cols]) => {
    txt += `\n${reg}:\n`;
    cols.forEach(c => txt += `${almocoState[c.nome].horario} – ${c.nome}\n`);
  });
  document.getElementById('almoco-output').textContent = txt.trim();
}

function copyAlmoco() {
  const txt = document.getElementById('almoco-output').textContent;
  if (!txt || txt.includes('Marque')) return showToast('Nada para copiar ainda!');
  copyText(txt, 'Lista de almoço copiada!');
}

function clearAlmoco() {
  showConfirm(
    'Limpar almoços?',
    'Todos os horários voltam ao padrão e as marcações serão apagadas.',
    () => {
      COLABORADORES.forEach(c => { almocoState[c.nome] = { horario: c.almoco, done: false }; });
      renderAlmocoList();
      document.getElementById('almoco-output').innerHTML = '<em>Marque os almoços acima para gerar a mensagem...</em>';
      showToast('Almoços limpos!');
    }
  );
}

// ─── TEAM MANAGER ───────────────────────────────────────
function getRegioes() {
  const set = new Set(COLABORADORES.map(c => c.regiao));
  return [...set].sort();
}

function renderTeam() {
  const list = document.getElementById('team-list');
  if (!list) return;
  list.innerHTML = '';

  const byRegion = groupByRegion(COLABORADORES);
  Object.entries(byRegion).forEach(([reg, cols]) => {
    const label = document.createElement('div');
    label.className = 'sec-label';
    label.textContent = reg;
    list.appendChild(label);

    cols.forEach((c, idx) => {
      const globalIdx = COLABORADORES.indexOf(c);
      const [bg, fg] = avatarColor(c.nome);
      const row = document.createElement('div');
      row.className = 'team-row';
      row.innerHTML = `
        <div class="person-avatar" style="background:${bg};color:${fg};width:30px;height:30px;font-size:11px">${initials(c.nome)}</div>
        <div class="team-row-info">
          <div class="team-row-name">${c.nome}</div>
          <div class="team-row-sub">${c.horario} · ${c.regiao} · almoço ${c.almoco}</div>
        </div>
        <button class="team-edit-btn" onclick="openEditColaborador(${globalIdx})" title="Editar">✏</button>
        <button class="team-del-btn"  onclick="deleteColaborador(${globalIdx})" title="Remover">✕</button>
      `;
      list.appendChild(row);
    });
  });

  // populate region datalist
  const dl = document.getElementById('regiao-list');
  if (dl) {
    dl.innerHTML = '';
    getRegioes().forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      dl.appendChild(opt);
    });
  }
}

let editingIdx = null;

function openAddColaborador() {
  editingIdx = null;
  document.getElementById('colab-modal-title').textContent = 'Adicionar Colaborador';
  document.getElementById('colab-nome').value = '';
  document.getElementById('colab-horario').value = '';
  document.getElementById('colab-regiao').value = '';
  document.getElementById('colab-almoco').value = '12:00';
  openModal('modal-colab');
}

function openEditColaborador(idx) {
  editingIdx = idx;
  const c = COLABORADORES[idx];
  document.getElementById('colab-modal-title').textContent = 'Editar Colaborador';
  document.getElementById('colab-nome').value = c.nome;
  document.getElementById('colab-horario').value = c.horario;
  document.getElementById('colab-regiao').value = c.regiao;
  document.getElementById('colab-almoco').value = c.almoco;
  openModal('modal-colab');
}

function saveColaborador() {
  const nome    = document.getElementById('colab-nome').value.trim();
  const horario = document.getElementById('colab-horario').value.trim();
  const regiao  = document.getElementById('colab-regiao').value.trim();
  const almoco  = document.getElementById('colab-almoco').value;

  if (!nome || !horario || !regiao) return showToast('Preencha todos os campos!');

  if (editingIdx !== null) {
    const old = COLABORADORES[editingIdx];
    // migrate state keys if name changed
    if (old.nome !== nome) {
      escalaState[nome] = escalaState[old.nome] || { status: 'none', obs: '' };
      almocoState[nome] = almocoState[old.nome] || { horario: almoco, done: false };
      delete escalaState[old.nome];
      delete almocoState[old.nome];
    }
    COLABORADORES[editingIdx] = { nome, horario, regiao, almoco };
    showToast('Colaborador atualizado!');
  } else {
    COLABORADORES.push({ nome, horario, regiao, almoco });
    escalaState[nome] = { status: 'none', obs: '' };
    almocoState[nome] = { horario: almoco, done: false };
    showToast('Colaborador adicionado!');
  }

  saveColaboradores();
  closeModal('modal-colab');
  renderTeam();
  renderEscala();
  renderAlmocoList();
  generateAlmoco();
}

function deleteColaborador(idx) {
  const c = COLABORADORES[idx];
  showConfirm(
    `Remover ${c.nome}?`,
    'Ele será removido da equipe e de todas as escalas futuras.',
    () => {
      COLABORADORES.splice(idx, 1);
      delete escalaState[c.nome];
      delete almocoState[c.nome];
      saveColaboradores();
      renderTeam();
      renderEscala();
      renderAlmocoList();
      generateAlmoco();
      showToast(`${c.nome} removido!`);
    }
  );
}

function resetTeam() {
  showConfirm(
    'Restaurar equipe padrão?',
    'Todos os colaboradores voltarão à lista original. Alterações serão perdidas.',
    () => {
      COLABORADORES.length = 0;
      COLABORADORES_DEFAULT.forEach(c => COLABORADORES.push({...c}));
      escalaState = {}; almocoState = {};
      initState();
      saveColaboradores();
      renderTeam();
      renderEscala();
      renderAlmocoList();
      generateAlmoco();
      showToast('Equipe restaurada!');
    }
  );
}

// ─── MODAL SYSTEM ───────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ─── CONFIRM MODAL ──────────────────────────────────────
let _confirmCb = null;
function showConfirm(title, desc, cb) {
  _confirmCb = cb;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-desc').textContent = desc;
  openModal('modal-confirm');
}
function confirmYes() {
  closeModal('modal-confirm');
  if (_confirmCb) { _confirmCb(); _confirmCb = null; }
}
function confirmNo() {
  closeModal('modal-confirm');
  _confirmCb = null;
}

// ─── COPY UTIL ──────────────────────────────────────────
function copyText(txt, msg) {
  function ok() { showToast(msg || 'Copiado!'); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(ok).catch(() => fallback(txt, ok));
  } else { fallback(txt, ok); }
}
function fallback(txt, cb) {
  const ta = document.createElement('textarea');
  ta.value = txt;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); cb(); } catch(e) { alert('Copie manualmente:\n\n' + txt); }
  document.body.removeChild(ta);
}

// ─── TOAST ──────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── HERMES INTEGRATION ──────────────────────────────────
// O site não manda mais direto pro Discord.
// Ele envia o estado para /api/hermes (Vercel API Route)
// que repassa ao Hermes rodando no Railway.

function updateDiscordStatusDot() {
  const dot = document.getElementById('discord-status-dot');
  if (!dot) return;
  // Dot verde fixo — Hermes está sempre conectado via Railway
  dot.className = 'discord-status-dot connected';
}

function openDiscordConfig() {
  // Nesse modelo o modal vira apenas informativo
  const r = document.getElementById('discord-test-result');
  if (r) r.style.display = 'none';
  openModal('modal-discord');
}

function saveDiscordConfig() {
  closeModal('modal-discord');
  showToast('Configuração salva!');
}

async function testDiscordWebhook() {
  const r = document.getElementById('discord-test-result');
  r.style.display = 'block';
  r.style.background = 'var(--surface2)'; r.style.border = '1px solid var(--border)'; r.style.color = 'var(--text-muted)';
  r.textContent = '⏳ Verificando conexão com o Hermes...';

  try {
    const res = await fetch('/api/hermes/health');
    if (res.ok) {
      const data = await res.json();
      r.style.background = 'var(--green-bg)'; r.style.border = '1px solid var(--green-border)'; r.style.color = 'var(--green)';
      r.textContent = `✓ Hermes online! Bot: ${data.bot || 'conectado'}`;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    r.style.background = 'var(--red-bg)'; r.style.border = '1px solid var(--red-border)'; r.style.color = 'var(--red)';
    r.textContent = `✕ Hermes offline ou não configurado: ${e.message}`;
  }
}

async function sendViaHermes(tipo, payload, btnId) {
  const btn = document.getElementById(btnId);
  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Enviando...';

  try {
    const res = await fetch('/api/hermes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, ...payload })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showToast('⚡ Hermes disparou a mensagem!');
    } else {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
  } catch (e) {
    showToast('Erro: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHTML;
  }
}

function sendEscalaDiscord() {
  const txt = document.getElementById('escala-output').textContent;

  if (!txt || txt.includes('Configure')) {
    showToast('Gere a escala antes de enviar!');
    return;
  }

  sendViaHermes('escala', {
    escalaState,
    data: currentDate
  }, 'btn-send-escala');
}

function sendAlmocoDiscord() {
  const txt = document.getElementById('almoco-output').textContent;

  if (!txt || txt.includes('Marque')) {
    showToast('Marque os almoços antes de enviar!');
    return;
  }

  sendViaHermes('almoco', {
    almocoState,
    data: currentDate
  }, 'btn-send-almoco');
}

// Init
updateDiscordStatusDot();
// ─── INIT ───────────────────────────────────────────────
renderEscala();
renderAlmocoList();
renderTeam();
generateAlmoco();
