/**
 * Programação de Seminários — Frontend
 * Firebase Realtime Database + tempo real
 */

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCHmACEdHqnicy1o9fgWc_nBXi_cX_J19z8",
  authDomain: "seminario-56c0f.firebaseapp.com",
  databaseURL: "https://seminario-56c0f-default-rtdb.firebaseio.com",
  projectId: "seminario-56c0f",
  storageBucket: "seminario-56c0f.firebasestorage.app",
  messagingSenderId: "5049500377",
  appId: "1:5049500377:web:68b74b5496fc0bc804f4c8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── Estado global ────────────────────────────────────────────────────────────
let EVENTS = [];

// Estado por página (persiste entre re-renders)
const pageState = {
  selectedISO: null,
  currentClass: "Todas",
  tvIndex: 0,
  calInstance: null
};

// ─── Mapeamento Firebase → App ────────────────────────────────────────────────
const CLASS_LABELS = {
  "1periodo":       "1º Período",
  "2periodo":       "2º Período",
  "3periodo":       "3º Período",
  "4periodo":       "4º Período",
  "5periodo":       "5º Período",
  "6periodo":       "6º Período",
  "principiantes":  "Principiantes",
  "unidos":         "Unidos em Família",
  "geral":          "Geral"
};

function maanaimToLocation(slug) {
  if (slug === "terra-vermelha") return "tv";
  return "dm";
}

function firebaseToAppEvent(e) {
  return {
    id:           e.id,
    location:     maanaimToLocation(e.maanaim),
    class:        e.class || "geral",
    area:         e.area  || "—",
    startISO:     e.startDate,
    startTime:    e.startTime,
    endISO:       e.endDate,
    endTime:      e.endTime,
    title:        (e.name || "").toUpperCase(),
    priceAdult:   parseFloat(e.price) || 0,
    regUntilISO:  e.deadline,
    // Usa imagem salva no Firebase; fallback para imagem padrão
    inviteImage:  e.inviteImage || "./assets/convite-tv.png"
  };
}

// ─── Cache localStorage ───────────────────────────────────────────────────────
const CACHE_KEY = "seminarios_v1_events";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutos

function saveCache(events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), events }));
  } catch (_) {}
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, events } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return events;
  } catch (_) { return null; }
}

function isValidEvent(ev) {
  return ev.startISO && ev.endISO && ev.regUntilISO;
}

function sortEvents() {
  EVENTS.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

// ─── Firebase: carga inicial + listeners incrementais ─────────────────────────
// Estratégia:
// 1. Mostra cache instantaneamente (zero requisição Firebase)
// 2. Faz UMA leitura do Firebase para sincronizar
// 3. Usa child_added/changed/removed (só trafega o que mudou, não tudo)
// 4. Desconecta quando aba fica em background (economiza conexões simultâneas)

const _initialIds = new Set(); // IDs da carga inicial (para não notificar como novos)
let   _initialDone = false;

function setupFirebase() {
  // 1. Carregar cache imediatamente (sem usar Firebase)
  const cached = loadCache();
  if (cached && cached.length) {
    EVENTS = cached;
    refreshCurrentPage();
  }

  // 2. Carregar do Firebase uma única vez
  db.ref("events").once("value", (snapshot) => {
    EVENTS = [];
    snapshot.forEach((child) => {
      _initialIds.add(child.key);
      const ev = firebaseToAppEvent(child.val());
      if (isValidEvent(ev)) EVENTS.push(ev);
    });
    sortEvents();
    saveCache(EVENTS);
    refreshCurrentPage();
    _initialDone = true;

    // 3. Após carga inicial, ativar listeners incrementais
    _startIncrementalListeners();
  });

  // 4. Desconectar/reconectar conforme visibilidade da aba
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      db.goOffline();
    } else {
      db.goOnline();
    }
  });
}

function _startIncrementalListeners() {
  const ref = db.ref("events");

  // Novo evento adicionado
  ref.on("child_added", (snapshot) => {
    if (!_initialDone) return;
    if (_initialIds.has(snapshot.key)) return; // já tínhamos na carga inicial

    const ev = firebaseToAppEvent(snapshot.val());
    if (!isValidEvent(ev) || EVENTS.find(e => e.id === ev.id)) return;

    EVENTS.push(ev);
    sortEvents();
    saveCache(EVENTS);
    refreshCurrentPage();

    // Notificar usuário
    if (_notificationsEnabled) {
      showNotification("🎉 Novo Evento!", `${ev.title} — ${fmtBR(ev.startISO)}`);
    }
  });

  // Evento editado
  ref.on("child_changed", (snapshot) => {
    if (!_initialDone) return;
    const ev = firebaseToAppEvent(snapshot.val());
    const idx = EVENTS.findIndex(e => e.id === ev.id);
    if (idx !== -1) {
      EVENTS[idx] = ev;
      saveCache(EVENTS);
      refreshCurrentPage();
    }
  });

  // Evento removido
  ref.on("child_removed", (snapshot) => {
    if (!_initialDone) return;
    const key = snapshot.val()?.id || snapshot.key;
    EVENTS = EVENTS.filter(e => e.id !== key);
    saveCache(EVENTS);
    refreshCurrentPage();
  });
}

function refreshCurrentPage() {
  const page = document.body.dataset.page;
  if (page === "home") refreshHome();
  if (page === "dm")   refreshDM();
  if (page === "tv")   refreshTV();
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function locationLabel(key) {
  return key === "tv" ? "Maanaim Terra Vermelha-ES" : "Maanaim Domingos Martins-ES";
}
function fmtBR(iso) {
  const [y, m, d] = String(iso || "").split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
function moneyBRL(n) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(n);
  } catch {
    return `R$ ${Number(n).toFixed(2)}`;
  }
}
function isoFromDate(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}
function classLabel(cls) {
  return CLASS_LABELS[cls] || cls;
}

// ─── Pills ativo ──────────────────────────────────────────────────────────────
function setActivePills() {
  const path = location.pathname.split("/").pop() || "index.html";
  const map  = {
    "index.html": "pill-home",
    "":           "pill-home",
    "domingos-martins.html": "pill-dm",
    "terra-vermelha.html":   "pill-tv"
  };
  const id = map[path] || "pill-home";
  for (const el of document.querySelectorAll(".pill")) el.classList.remove("active");
  const active = document.getElementById(id);
  if (active) active.classList.add("active");
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function modalOpen(event) {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.add("open");

  const cls = event.class && event.class !== "geral" ? classLabel(event.class) : null;
  document.getElementById("m-title").textContent = cls || event.title || "DETALHES";
  document.getElementById("m-sub").textContent   = locationLabel(event.location);

  fillMiniDate("m-start", "INÍCIO", event.startISO, event.startTime);
  fillMiniDate("m-end",   "FIM",    event.endISO,   event.endTime);

  document.getElementById("m-area").textContent  = event.area || "—";
  document.getElementById("m-local").textContent = locationLabel(event.location);

  const priceEl = document.getElementById("m-price");
  priceEl.textContent = event.priceAdult ? `${moneyBRL(event.priceAdult)} (adulto)` : "Gratuito";
  priceEl.classList.toggle("green", !event.priceAdult);

  document.getElementById("m-reguntil").textContent = fmtBR(event.regUntilISO);

  const clsInfo = event.class && event.class !== "geral" ? `\n* Classe: ${classLabel(event.class)}` : "";
  const shareText = `APDSJ

Quero me inscrever nesse evento:
* ${event.title}
* Local: ${locationLabel(event.location)}
* Área: ${event.area || "—"}${clsInfo}
* Início: ${fmtBR(event.startISO)} às ${event.startTime}
* Fim: ${fmtBR(event.endISO)} às ${event.endTime}
* Valor: ${event.priceAdult ? moneyBRL(event.priceAdult) + " (adulto)" : "Gratuito"}
* Inscrições até: ${fmtBR(event.regUntilISO)}`;

  modal.dataset.share = shareText;
}
function fillMiniDate(prefix, label, iso, time) {
  const d   = new Date(iso + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleDateString("pt-BR", { month: "short" });
  document.querySelector(`#${prefix} .l`).textContent = label;
  document.querySelector(`#${prefix} .d`).textContent = day;
  document.querySelector(`#${prefix} .m`).textContent = mon;
  document.querySelector(`#${prefix} .t`).textContent = time || "";
}
function modalClose() {
  const modal = document.getElementById("modal");
  if (modal) modal.classList.remove("open");
}
async function copyShare() {
  const modal = document.getElementById("modal");
  const text  = modal?.dataset?.share || "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}
function shareWhatsApp() {
  const modal = document.getElementById("modal");
  const text  = modal?.dataset?.share || "";
  if (!text) return;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}
function bindModal() {
  const closeBtn = document.getElementById("modal-close");
  const modal    = document.getElementById("modal");
  if (closeBtn) closeBtn.addEventListener("click", modalClose);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modalClose(); });
  const copyBtn = document.getElementById("btn-copy");
  const waBtn   = document.getElementById("btn-wa");
  if (copyBtn) copyBtn.addEventListener("click", copyShare);
  if (waBtn)   waBtn.addEventListener("click", shareWhatsApp);
}

// ─── Calendário ───────────────────────────────────────────────────────────────
function initCalendar(rootId, opts) {
  const root = document.getElementById(rootId);
  if (!root) return null;

  let selectedISO = "";
  let cursor = startOfMonth(new Date());

  const monthEl = root.querySelector("[data-cal-month]");
  const gridEl  = root.querySelector("[data-cal-grid]");
  const prevBtn = root.querySelector("[data-cal-prev]");
  const nextBtn = root.querySelector("[data-cal-next]");

  function render() {
    monthEl.textContent = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const start = startOfMonth(cursor);
    const end   = endOfMonth(cursor);
    const pad   = start.getDay();
    const total = end.getDate();

    gridEl.innerHTML = "";

    for (let i = 0; i < pad; i++) {
      const div = document.createElement("div");
      div.className = "empty";
      gridEl.appendChild(div);
    }

    const markerSet = new Set(opts.markerISOs());

    for (let day = 1; day <= total; day++) {
      const d   = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      const iso = isoFromDate(d);
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.className = "cal-cell";
      btn.textContent = String(day);

      if (isSameDay(d, new Date())) btn.classList.add("today");
      if (selectedISO && iso === selectedISO) btn.classList.add("selected");

      if (markerSet.has(iso)) {
        const dot = document.createElement("span");
        dot.className = "dot";
        btn.appendChild(dot);
      }

      btn.addEventListener("click", () => {
        selectedISO = iso;
        render();
        opts.onSelectISO(selectedISO);
      });

      gridEl.appendChild(btn);
    }
  }

  prevBtn.addEventListener("click", () => { cursor = addMonths(cursor, -1); render(); });
  nextBtn.addEventListener("click", () => { cursor = addMonths(cursor, 1);  render(); });

  render();

  return {
    render,
    setSelectedISO(iso) { selectedISO = iso || ""; render(); },
    getSelectedISO()    { return selectedISO; }
  };
}

// ─── Painel de eventos ────────────────────────────────────────────────────────
function renderEventsPanel(panelId, selectedISO, list) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const sub    = panel.querySelector("[data-ep-sub]");
  const listEl = panel.querySelector("[data-ep-list]");

  if (!selectedISO) {
    sub.textContent = "Selecione uma data";
    listEl.innerHTML = `
      <div style="display:grid;place-items:center;text-align:center;padding:30px 0;color:var(--muted)">
        <div class="badge" style="justify-content:center"><span style="color:var(--brand);font-weight:900">📅</span> Selecione uma data</div>
        <div style="margin-top:8px;font-weight:800;color:var(--text)">Selecione uma data</div>
        <div style="margin-top:4px;font-size:12px">Clique em um dia do calendário para ver os eventos.</div>
      </div>`;
    return;
  }

  sub.textContent = `Eventos em ${fmtBR(selectedISO)}`;

  if (!list.length) {
    listEl.innerHTML = `
      <div style="display:grid;place-items:center;text-align:center;padding:26px 0;color:var(--muted)">
        <div style="font-weight:900;color:var(--text)">Nenhum evento para esta data</div>
        <div style="margin-top:4px;font-size:12px">Tente escolher outro dia no calendário.</div>
      </div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const e of list) {
    const item = document.createElement("div");
    item.className = "event";
    const clsText = e.class && e.class !== "geral" ? ` • ${escapeHtml(classLabel(e.class))}` : "";
    item.innerHTML = `
      <div style="min-width:0">
        <h4>${escapeHtml(e.title)}</h4>
        <p>${escapeHtml(e.startTime)} • ${escapeHtml(locationLabel(e.location))}${clsText}</p>
      </div>
      <button class="btn" type="button" style="height:36px">Ver</button>`;
    item.querySelector("button").addEventListener("click", () => modalOpen(e));
    listEl.appendChild(item);
  }
}

// ─── Página: Home (todos) ─────────────────────────────────────────────────────
function initHome() {
  pageState.calInstance = initCalendar("cal-home", {
    markerISOs:  () => [...new Set(EVENTS.map(e => e.startISO))],
    onSelectISO: (iso) => {
      pageState.selectedISO = iso;
      renderEventsPanel("panel-home", iso, EVENTS.filter(e => e.startISO === iso));
    }
  });
  renderEventsPanel("panel-home", null, []);
}

function refreshHome() {
  if (!pageState.calInstance) return;
  pageState.calInstance.render();
  if (pageState.selectedISO) {
    renderEventsPanel("panel-home", pageState.selectedISO,
      EVENTS.filter(e => e.startISO === pageState.selectedISO));
  }
}

// ─── Página: Domingos Martins ─────────────────────────────────────────────────

// Lê os dois filtros do estado e renderiza
function renderDMPanel() {
  const panel  = document.getElementById("panel-dm");
  if (!panel) return;

  const sub    = panel.querySelector("[data-ep-sub]");
  const listEl = panel.querySelector("[data-ep-list]");

  // Lê os filtros diretamente do pageState (nunca de closures)
  const dataFiltro   = pageState.dmDate  || null;
  const classeFiltro = pageState.dmClass || "Todas";

  let events = EVENTS.filter(e => e.location === "dm");

  if (dataFiltro) {
    events = events.filter(e => e.startISO === dataFiltro);
  }

  if (classeFiltro !== "Todas") {
    events = events.filter(e => e.class === classeFiltro);
  }

  // Subtítulo dinâmico
  if (dataFiltro && classeFiltro !== "Todas") {
    sub.textContent = `${fmtBR(dataFiltro)} • ${classLabel(classeFiltro)}`;
  } else if (dataFiltro) {
    sub.textContent = `Eventos em ${fmtBR(dataFiltro)}`;
  } else if (classeFiltro !== "Todas") {
    sub.textContent = `Classe: ${classLabel(classeFiltro)}`;
  } else {
    sub.textContent = `${events.length} evento(s) encontrado(s)`;
  }

  if (!events.length) {
    listEl.innerHTML = `
      <div style="display:grid;place-items:center;text-align:center;padding:26px 0;color:var(--muted)">
        <div style="font-weight:900;color:var(--text)">Nenhum evento encontrado</div>
        <div style="margin-top:4px;font-size:12px">Tente outro filtro ou outra data.</div>
      </div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const e of events) {
    const item = document.createElement("div");
    item.className = "event";
    const clsText = e.class && e.class !== "geral" ? ` • ${escapeHtml(classLabel(e.class))}` : "";
    item.innerHTML = `
      <div style="min-width:0">
        <h4>${escapeHtml(e.title)}</h4>
        <p>${fmtBR(e.startISO)} • ${escapeHtml(e.startTime)}${clsText}</p>
      </div>
      <button class="btn" type="button" style="height:36px">Ver</button>`;
    item.querySelector("button").addEventListener("click", () => modalOpen(e));
    listEl.appendChild(item);
  }
}

function initDM() {
  pageState.dmDate  = null;
  pageState.dmClass = "Todas";

  pageState.calInstance = initCalendar("cal-dm", {
    markerISOs: () => [...new Set(EVENTS.filter(e => e.location === "dm").map(e => e.startISO))],
    onSelectISO: (iso) => {
      if (pageState.dmDate === iso) {
        // Mesma data: limpa filtro de data (volta a mostrar tudo)
        pageState.dmDate = null;
        pageState.calInstance.setSelectedISO(null);
      } else {
        // Nova data: zera filtro de classe, aplica data
        pageState.dmDate  = iso;
        pageState.dmClass = "Todas";
        const sel = document.getElementById("class-select");
        if (sel) sel.value = "Todas";
      }
      renderDMPanel();
    }
  });

  document.getElementById("class-select")?.addEventListener("change", function () {
    // Filtrar por classe: zera filtro de data
    pageState.dmClass = this.value;
    pageState.dmDate  = null;
    pageState.calInstance?.setSelectedISO(null);
    renderDMPanel();
  });

  renderDMPanel();
}

function refreshDM() {
  if (!pageState.calInstance) return;
  pageState.calInstance.render();
  renderDMPanel();
}

// ─── Página: Terra Vermelha ───────────────────────────────────────────────────
function initTV() {
  refreshTV();
}

function refreshTV() {
  const slides = EVENTS.filter(e => e.location === "tv");

  const imgEl     = document.getElementById("tv-img");
  const tagEl     = document.getElementById("tv-tag");
  const locEl     = document.getElementById("tv-loc");
  const t1El      = document.getElementById("tv-t1");
  const t2El      = document.getElementById("tv-t2");
  const counterEl = document.getElementById("tv-counter");
  const dotsEl    = document.getElementById("tv-dots");
  const btnDetails = document.getElementById("tv-details");

  if (!imgEl) return; // página ainda não carregou

  if (!slides.length) {
    // Nenhum evento cadastrado
    if (tagEl)      tagEl.style.display = "none";
    if (t1El)       t1El.textContent    = "Nenhum evento disponível";
    if (t2El)       t2El.textContent    = "";
    if (counterEl)  counterEl.textContent = "";
    if (dotsEl)     dotsEl.innerHTML    = "";
    if (btnDetails) btnDetails.style.display = "none";
    return;
  }

  if (pageState.tvIndex >= slides.length) pageState.tvIndex = 0;
  if (btnDetails) btnDetails.style.display = "";

  function renderSlide() {
    const e = slides[pageState.tvIndex];

    imgEl.src = e.inviteImage;

    if (e.class && e.class !== "geral") {
      tagEl.style.display  = "inline-flex";
      tagEl.textContent    = classLabel(e.class).toUpperCase();
    } else {
      tagEl.style.display = "none";
    }

    locEl.textContent     = locationLabel(e.location);
    t1El.textContent      = e.title;
    t2El.textContent      = `${fmtBR(e.startISO)} • ${e.startTime}`;
    counterEl.textContent = `Use as setas para navegar • ${pageState.tvIndex + 1}/${slides.length}`;

    dotsEl.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dotbtn" + (i === pageState.tvIndex ? " active" : "");
      b.type = "button";
      b.addEventListener("click", () => { pageState.tvIndex = i; renderSlide(); });
      dotsEl.appendChild(b);
    });

    btnDetails.onclick = () => modalOpen(e);
  }

  // Bind arrows apenas na primeira vez (evitar listeners duplicados)
  if (!document.getElementById("tv-prev")._bound) {
    document.getElementById("tv-prev").addEventListener("click", () => {
      pageState.tvIndex = (pageState.tvIndex - 1 + slides.length) % slides.length;
      renderSlide();
    });
    document.getElementById("tv-next").addEventListener("click", () => {
      pageState.tvIndex = (pageState.tvIndex + 1) % slides.length;
      renderSlide();
    });
    document.getElementById("tv-prev")._bound = true;
  }

  renderSlide();
}

// ─── Notificações ─────────────────────────────────────────────────────────────
let _notificationsEnabled = false;

function setupNotifications() {
  // Notificações são disparadas dentro de _startIncrementalListeners()
  // quando _notificationsEnabled = true
  if (Notification.permission === "granted") {
    _notificationsEnabled = true;
  }
}

function showNotification(title, body) {
  if (Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon:    "./assets/logo.png",
        vibrate: [200, 100, 200],
        tag:     "novo-evento"
      });
    });
  } else {
    new Notification(title, { body, icon: "./assets/logo.png" });
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Este navegador não suporta notificações.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    _notificationsEnabled = true;
    updateNotifyBtn();
    showNotification("🔔 Alertas Ativados!", "Você receberá avisos quando novos eventos forem adicionados.");
  } else {
    alert("Permita notificações para receber alertas de novos eventos.");
  }
}

function updateNotifyBtn() {
  const btn = document.getElementById("btn-notify");
  if (!btn) return;
  if (Notification.permission === "granted") {
    btn.textContent = "🔔 Alertas ativos";
    btn.disabled = true;
    btn.style.opacity = ".7";
  }
}

// ─── PWA: Service Worker ──────────────────────────────────────────────────────
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  registerSW();
  setActivePills();
  bindModal();
  setupFirebase();        // Conecta ao Firebase (dados + tempo real)
  setupNotifications();   // Inicia monitor de notificações

  // Botão de notificações (se existir na página)
  const btnNotify = document.getElementById("btn-notify");
  if (btnNotify) {
    btnNotify.addEventListener("click", requestNotificationPermission);
    updateNotifyBtn();
  }

  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "dm")   initDM();
  if (page === "tv")   initTV();
});

});
