// DASSH Console — interface (abas de sessão, cofre, histórico, evidências, WhatsApp)
const $ = (s) => document.querySelector(s);
const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Temas do terminal: o atual + os esquemas de cor mais usados por devs/suporte (Windows Terminal, VS Code, iTerm2).
// O tema muda só a TELA. A evidência continua no padrão aprovado (preto/cinza estilo PuTTY).
const ANSI = (c) => Object.fromEntries(["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
  "brightBlack", "brightRed", "brightGreen", "brightYellow", "brightBlue", "brightMagenta", "brightCyan", "brightWhite"]
  .map((k, i) => [k, c[i]]));
const TEMAS = {
  dassh: { nome: "DASSH (padrão)", fonte: "Consolas", t: { background: "#0b0f14", foreground: "#d8dee9", cursor: "#00dc78",
    selectionBackground: "#2d5a4f", ...ANSI(["#1c2128", "#ff6b6b", "#5ee0b5", "#f0c674", "#6cb6ff", "#d2a8ff", "#56d4dd", "#d8dee9",
    "#6e7681", "#ff8f8f", "#8df0cc", "#ffd98a", "#9ccfff", "#e2c5ff", "#8be6ec", "#ffffff"]) } },
  putty: { nome: "PuTTY clássico", fonte: "'Courier New'", t: { background: "#000000", foreground: "#bbbbbb", cursor: "#00ff00",
    selectionBackground: "#555555", ...ANSI(["#000000", "#bb0000", "#00bb00", "#bbbb00", "#0000bb", "#bb00bb", "#00bbbb", "#bbbbbb",
    "#555555", "#ff5555", "#55ff55", "#ffff55", "#5555ff", "#ff55ff", "#55ffff", "#ffffff"]) } },
  campbell: { nome: "Windows Terminal (Campbell)", fonte: "'Cascadia Mono', Consolas", t: { background: "#0c0c0c", foreground: "#cccccc",
    cursor: "#ffffff", selectionBackground: "#3a3a3a", ...ANSI(["#0c0c0c", "#c50f1f", "#13a10e", "#c19c00", "#0037da", "#881798",
    "#3a96dd", "#cccccc", "#767676", "#e74856", "#16c60c", "#f9f1a5", "#3b78ff", "#b4009e", "#61d6d6", "#f2f2f2"]) } },
  dracula: { nome: "Dracula", fonte: "Consolas", t: { background: "#282a36", foreground: "#f8f8f2", cursor: "#f8f8f2",
    selectionBackground: "#44475a", ...ANSI(["#21222c", "#ff5555", "#50fa7b", "#f1fa8c", "#bd93f9", "#ff79c6", "#8be9fd", "#f8f8f2",
    "#6272a4", "#ff6e6e", "#69ff94", "#ffffa5", "#d6acff", "#ff92df", "#a4ffff", "#ffffff"]) } },
  onedark: { nome: "One Dark", fonte: "Consolas", t: { background: "#282c34", foreground: "#abb2bf", cursor: "#528bff",
    selectionBackground: "#3e4451", ...ANSI(["#282c34", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#abb2bf",
    "#5c6370", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#ffffff"]) } },
  solarized: { nome: "Solarized Dark", fonte: "Consolas", t: { background: "#002b36", foreground: "#839496", cursor: "#93a1a1",
    selectionBackground: "#073642", ...ANSI(["#073642", "#dc322f", "#859900", "#b58900", "#268bd2", "#d33682", "#2aa198", "#eee8d5",
    "#002b36", "#cb4b16", "#586e75", "#657b83", "#839496", "#6c71c4", "#93a1a1", "#fdf6e3"]) } },
  fosforo: { nome: "Retrô (fósforo verde)", fonte: "'Courier New'", t: { background: "#050a05", foreground: "#33ff66", cursor: "#33ff66",
    selectionBackground: "#1f4d2a", ...ANSI(["#050a05", "#66ff99", "#33ff66", "#99ff99", "#22cc55", "#55ee88", "#88ffaa", "#33ff66",
    "#1f7a3a", "#88ffaa", "#66ff99", "#ccffcc", "#44dd77", "#77ffaa", "#aaffcc", "#e6ffe6"]) } },
};
let temaAtual = "dassh", TEMA = TEMAS.dassh.t, PALETA = paleta(TEMA);
function paleta(T) {
  const n = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
  const p = [...n.map((k) => T[k]), ...n.map((k) => T["bright" + k[0].toUpperCase() + k.slice(1)])];
  const h = (v) => v.toString(16).padStart(2, "0"), lv = [0, 95, 135, 175, 215, 255];
  for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) p.push("#" + h(lv[r]) + h(lv[g]) + h(lv[b]));
  for (let i = 0; i < 24; i++) { const v = 8 + i * 10; p.push("#" + h(v) + h(v) + h(v)); }
  return p;
}
// Vitrine: cada tema com uma telinha de terminal nas cores reais
function abrirTemas() {
  const pop = $("#tema-pop"), g = $("#tp-grade");
  if (!pop.classList.contains("oculto")) return pop.classList.add("oculto");
  g.innerHTML = "";
  Object.entries(TEMAS).forEach(([id, tm]) => {
    const t = tm.t, d = document.createElement("div");
    d.className = "tp-item" + (id === temaAtual ? " sel" : "");
    d.innerHTML = `<div class="tp-prev" style="background:${t.background};color:${t.foreground};font-family:${tm.fonte},monospace">` +
      `<span style="color:${t.green}">&lt;SW-CORE&gt;</span>display version\n` +
      `Huawei <span style="color:${t.cyan}">YunShan OS</span> 1.24\n` +
      `<span style="color:${t.yellow}">Warning</span>: <span style="color:${t.red}">fan 2 failed</span>\n` +
      `<span style="color:${t.green}">PS C:\\&gt;</span> <span style="color:${t.blue}">Get-Date</span><span style="background:${t.cursor}"> </span></div>` +
      `<div class="tp-nome"><span>${esc(tm.nome)}</span>${id === temaAtual ? '<span class="ok">✔ em uso</span>' : ""}</div>`;
    d.onclick = () => { aplicarTema(id, true); abrirTemas(); abrirTemas(); A() && A().term.focus(); toast("Tema: " + tm.nome); };
    g.appendChild(d);
  });
  const r = $("#btn-tema").getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(r.right - 620, innerWidth - 628)) + "px"; pop.style.top = r.bottom + 8 + "px";
  pop.classList.remove("oculto");
}
function aplicarTema(id, salvar) {
  const tm = TEMAS[id] || TEMAS.dassh; temaAtual = TEMAS[id] ? id : "dassh";
  TEMA = { ...tm.t, cursorAccent: tm.t.background }; PALETA = paleta(TEMA);
  document.documentElement.style.setProperty("--term", TEMA.background);
  abas.forEach((a) => { a.term.options.theme = TEMA; a.term.options.fontFamily = tm.fonte + ", 'Courier New', monospace"; });
  const sel = document.querySelector("#tema"); if (sel) sel.value = temaAtual;
  if (salvar && api) api.salvar_pref("tema", temaAtual);
}
const NOMES_TIPO = { serial: "Serial", powershell: "PowerShell", cmd: "CMD", ssh: "SSH", azure: "Azure", gcp: "GCP", remoto: "Remoto", web: "Web" };
let NOME = "";  // nome do técnico (aparece no compartilhamento)
const RE_USER = /(user ?name|login|usu[aá]rio)\s*:\s*$/i;
const RE_PASS = /(password|senha)[^:]*:\s*$/i;

let api = null, ocupado = false, cofre = [], seq = 0, ativa = null;
const abas = new Map();
const A = () => abas.get(ativa);

// ================= utilidades =================
function toast(msg, cls = "") {
  const t = $("#toast"); t.textContent = msg; t.className = "mostrar " + cls;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = cls), 3800);
}
const abrirModal = (id) => $(id).classList.remove("oculto");
const fecharModal = (el) => el.closest(".modal").classList.add("oculto");

// ================= terminal sempre inteiro na tela =================
// O terminal é fixo em 100x30 (padrão da evidência). Em vez de cortar quando a janela diminui, a FONTE se ajusta
// ao espaço disponível (9 a 17 px) — vale para todas as abas, ao redimensionar, trocar de aba ou de tema.
function ajustarFonte() {
  const box = $("#terminal"); if (!box || !box.clientWidth) return;
  const cs = getComputedStyle(box);
  const W = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 6;
  const H = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 6;
  abas.forEach((a) => {
    if (a.tipo === "web" && a.conectado) return;
    let cel;
    try { cel = a.term._core._renderService.dimensions.css.cell; } catch (_) { cel = null; }
    if (!cel || !cel.width || !cel.height) cel = medirCelula(a.term);   // plano B: não depende da parte interna do xterm
    if (!cel || !cel.width || !cel.height) return;
    const fs = a.term.options.fontSize;
    let alvo = Math.floor(fs * Math.min(W / (a.term.cols * cel.width), H / (a.term.rows * cel.height)) * 2) / 2;
    alvo = Math.max(9, Math.min(17, alvo));
    // sem "pulsar": diminui na hora se não couber, mas só aumenta se sobrar espaço para 1 px inteiro
    // (o arredondamento da fonte fazia o tamanho oscilar entre dois valores a cada 2 s)
    if (alvo < fs || alvo >= fs + 1) a.term.options.fontSize = alvo;
  });
}
// mede uma célula do terminal com a mesma fonte (canvas) — usado se o xterm mudar a API interna numa atualização
function medirCelula(term) {
  const c = medirCelula.c || (medirCelula.c = document.createElement("canvas").getContext("2d"));
  const fs = term.options.fontSize;
  c.font = `${fs}px ${term.options.fontFamily}`;
  return { width: c.measureText("W").width, height: Math.ceil(fs * (term.options.lineHeight || 1) * 1.18) };
}
let _ajTimer = null;
const ajustarDepois = () => { clearTimeout(_ajTimer); _ajTimer = setTimeout(ajustarFonte, 60); };

// ================= logo vivo: cursor sincronizado com o do terminal + batida de coração =================
function iniciarLogo() {
  const cur = document.getElementById("logo-cursor"), logo = document.getElementById("logo");
  if (!cur || !logo || !cur.animate) return;
  // mesmo ritmo do cursor do xterm: 1 s, aceso na 1ª metade, apagado na 2ª
  const pisca = cur.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }],
                            { duration: 1000, iterations: Infinity });
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const brilho = (a) => `drop-shadow(0 2px ${4 + a * 8}px rgba(0,200,150,${0.3 + a * 0.45}))`;
  const bate = calmo ? null : logo.animate([      // "tum-tum" e pausa, a cada vez que o cursor acende
    { transform: "scale(1)", filter: brilho(0) },
    { transform: "scale(1.10)", filter: brilho(1), offset: 0.08 },
    { transform: "scale(1)", filter: brilho(0.2), offset: 0.18 },
    { transform: "scale(1.06)", filter: brilho(0.7), offset: 0.26 },
    { transform: "scale(1)", filter: brilho(0), offset: 0.42 },
    { transform: "scale(1)", filter: brilho(0) }], { duration: 1000, iterations: Infinity, easing: "ease-out" });
  window.__logoDif = () => {   // (autoteste) diferença, em ms, entre o cursor do logo e o do terminal
    const c = A() && A().pane.querySelector(".xterm-cursor-blink"), x = c && c.getAnimations()[0];
    return x ? Math.round(Math.abs((x.currentTime % 1000) - (pisca.currentTime % 1000))) : "sem cursor piscando";
  };
  setInterval(() => {   // acompanha o relógio do cursor da aba ativa (ele reinicia a cada saída na tela)
    const a = A(), c = a && a.pane.querySelector(".xterm-cursor-blink");
    const x = c && c.getAnimations && c.getAnimations()[0];
    if (!x || x.currentTime == null) return;
    const alvo = x.currentTime % 1000;
    if (Math.abs(alvo - (pisca.currentTime % 1000)) > 25) {
      pisca.currentTime = x.currentTime; if (bate) bate.currentTime = x.currentTime;
    }
  }, 120);
}

// ================= chamadas vindas do Python =================
window.termWrite = (sid, d) => { const a = abas.get(sid); if (a) { a.term.write(d); a.ultimaEscrita = Date.now(); } };
window.onAviso = (sid, msg) => { const a = abas.get(sid); if (a) a.term.write(`\r\n\x1b[33m[${msg}]\x1b[0m\r\n`); toast(msg, "aviso"); };
window.onDesconectado = (sid, motivo) => {
  const a = abas.get(sid); if (!a) return;
  setConectado(a, false); a.term.write(`\r\n\x1b[33m[${motivo}]\x1b[0m\r\n`); toast(`${a.nome}: ${motivo}`, "aviso");
  if (a.tipo === "serial" && /lixo|perdida/i.test(motivo)) diagnosticarCabo();
};

// ================= abas =================
// Organização: número (= Ctrl+Alt+N), largura que encolhe por igual, arrastar para reordenar, botão do meio fecha,
// e o botão ▾ com a lista de todas as abas (estado, tempo, gravação) quando há 3 ou mais.
const ordemAbas = () => [...document.querySelectorAll("#abas-sessao .aba")].map((b) => b.dataset.id).filter((id) => abas.has(id));
function arrumarAbas() {
  ordemAbas().forEach((id, i) => { const a = abas.get(id); a.btn.querySelector(".num").textContent = i + 1;
    a.btn.title = `${a.nome}${a.equip ? " — " + a.equip : ""}  (Ctrl+Alt+${i + 1})`; });
  $("#abas-sessao").classList.toggle("muitas", abas.size >= 4);
  document.querySelector(".term-barra").classList.toggle("muitas", abas.size >= 4);
  $("#lista-abas").classList.toggle("oculto", abas.size < 3);
  $("#lista-abas").textContent = `▾ ${abas.size}`;
  $("#nova-aba").disabled = abas.size >= 8;
  $("#nova-aba").title = abas.size >= 8 ? "Limite de 8 abas — feche uma para abrir outra" : "Nova aba (Ctrl+Alt+T)";
  const at = A() && A().btn; if (at) at.scrollIntoView({ block: "nearest", inline: "nearest" });
}
function arrastavel(b) {
  b.draggable = true;
  b.addEventListener("dragstart", (e) => { b.classList.add("arrastando"); e.dataTransfer.effectAllowed = "move"; });
  b.addEventListener("dragend", () => { b.classList.remove("arrastando"); arrumarAbas(); });
  b.addEventListener("dragover", (e) => {
    const arr = document.querySelector(".aba.arrastando"); if (!arr || arr === b) return;
    e.preventDefault();
    const r = b.getBoundingClientRect();
    b.parentNode.insertBefore(arr, e.clientX < r.left + r.width / 2 ? b : b.nextSibling);
  });
}
function listaAbas() {
  const m = $("#menu-abas");
  if (!m.classList.contains("oculto")) return m.classList.add("oculto");
  const fmt = (a) => { if (!a.inicio) return ""; const s = Math.floor((Date.now() - a.inicio) / 1000);
    return `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ":" : ""}${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
  m.innerHTML = ordemAbas().map((id, i) => { const a = abas.get(id);
    return `<div class="ma-item ${id === ativa ? "ativa" : ""}" data-id="${id}"><span class="num">${i + 1}</span>
      <span class="ponto ${a.conectado ? "on" : ""}"></span><span class="ma-nome">${esc(a.nome)}${a.equip ? `<small>${esc(a.equip)}</small>` : ""}</span>
      <span class="ma-tempo">${fmt(a)}</span>${a.conectado && a.tipo !== "web" ? `<span class="ma-rec ${a.gravando ? "on" : ""}">${a.gravando ? "REC" : "sem REC"}</span>` : ""}
      <button class="fecha" data-x="${id}" title="Fechar">✕</button></div>`; }).join("") +
    `<div class="ma-rodape">Ctrl+Alt+1…8 troca · arraste para reordenar · botão do meio fecha</div>`;
  m.querySelectorAll(".ma-item").forEach((el) => (el.onclick = (e) => {
    if (e.target.dataset.x) { fecharAba(e.target.dataset.x); m.classList.add("oculto"); return; }
    ativar(el.dataset.id); m.classList.add("oculto");
  }));
  const r = $("#lista-abas").getBoundingClientRect();
  m.style.left = Math.max(8, r.left) + "px"; m.style.top = r.bottom + 4 + "px";
  m.classList.remove("oculto");
}
document.addEventListener("mousedown", (e) => {
  const m = $("#menu-abas"); if (m && !m.contains(e.target) && e.target.id !== "lista-abas") m.classList.add("oculto");
});

function novaAba(tipo) {
  if (abas.size >= 8) return toast("Máximo de 8 abas", "aviso");
  const id = "t" + (++seq);
  const pane = document.createElement("div"); pane.className = "term-pane"; $("#terminal").appendChild(pane);
  const fsAtual = ([...abas.values()].find((x) => x.term && x.tipo !== "web") || { term: { options: { fontSize: 15 } } }).term.options.fontSize;
  const term = new Terminal({ cols: 100, rows: 30, fontFamily: TEMAS[temaAtual].fonte + ", 'Courier New', monospace", fontSize: fsAtual,
    lineHeight: 1.05, cursorBlink: true, scrollback: 5000, theme: TEMA, allowProposedApi: true });
  const a = { id, term, pane, tipo: tipo || tipoTopo(), conectado: false, nome: "Nova aba", alvo: null, params: null,
              loginPend: null, ultimoPrompt: "", sugestao: null };
  abas.set(id, a);
  const b = document.createElement("div"); b.className = "aba"; b.dataset.id = id;
  b.innerHTML = `<span class="num"></span><span class="ponto"></span><span class="nome">Nova aba</span><span class="tempo" title="Tempo de sessão"></span><span class="rec" title="Gravação desta aba — clique para parar, gravar ou assistir">REC</span><button class="fecha" title="Fechar aba">✕</button>`;
  b.onclick = (e) => { if (!e.target.classList.contains("fecha") && !e.target.classList.contains("rec")) ativar(id); };
  b.onauxclick = (e) => { if (e.button === 1) { e.preventDefault(); fecharAba(id); } };   // botão do meio fecha (como no navegador)
  b.querySelector(".rec").onclick = () => menuGravacao(a);
  b.querySelector(".fecha").onclick = () => fecharAba(id);
  arrastavel(b);
  $("#abas-sessao").appendChild(b); a.btn = b;
  ativar(id); arrumarAbas();
  term.open(pane);
  a.ser = new SerializeAddon.SerializeAddon(); term.loadAddon(a.ser);
  term.attachCustomKeyEventHandler((e) => !atalho(e));
  term.onData((d) => {
    if (a.demo) return demoTecla(a, d);   // modo demonstração: Esc para, qualquer tecla acelera
    if (!a.conectado) return;
    if (a.share && !a.share.souAtivo) return avisoControle(a);  // observando: não digita
    api.escrever(id, d); if (a.sugestao && /\r/.test(d)) esconderSugestao(a);
  });
  term.onSelectionChange(() => { const s = term.getSelection(); if (s) navigator.clipboard.writeText(s).catch(() => {}); });
  term.onWriteParsed(() => verificarLogin(a));
  pane.addEventListener("contextmenu", async (e) => {
    e.preventDefault();
    // colar pelo Python (área de transferência do Windows): o navegador interno não pede mais permissão
    try { const t = await api.area_transferencia(); if (t && a.conectado) api.escrever(id, t.replace(/\r?\n/g, "\r")); } catch (_) {}
  });
  boasVindas(a);
  b.oncontextmenu = (e) => { e.preventDefault(); menuAba(a, e.clientX, e.clientY); };
  term.focus();
  return a;
}

// frase de boas-vindas digitada (como num terminal de verdade); para sozinha se a aba conectar
async function boasVindas(a) {
  const partes = [["\x1b[38;2;94;224;181m", "DASSH Console"], ["\x1b[0m", " — escolha a conexão no topo e clique em "],
                  ["\x1b[1m", "Conectar"], ["\x1b[0m", "."]];
  await new Promise((r) => setTimeout(r, 250));
  for (const [cor, txt] of partes) {
    a.term.write(cor);
    for (const ch of txt) {
      if (a.conectado || a.demo || !abas.has(a.id)) { a.term.write("\x1b[0m"); return; }
      a.term.write(ch);
      await new Promise((r) => setTimeout(r, ch === " " ? 22 : 16 + Math.random() * 30));
    }
  }
  a.term.write("\r\n");
}

function ativar(id) {
  ativa = id;
  abas.forEach((a) => { a.pane.classList.toggle("ativa", a.id === id); a.btn.classList.toggle("ativa", a.id === id); });
  const a = A();
  selecionarTipo(a.tipo, true);
  if (a.params) {
    if (a.params.porta) $("#porta").value = a.params.porta;
    if (a.params.baud) $("#baud").value = a.params.baud;
    if (a.params.destino) $("#ssh-destino").value = a.params.destino;
  }
  atualizarBotaoConectar();
  $("#aba-alvo").textContent = a.conectado ? a.nome : "";
  if (a.sugestao) mostrarSugestao(a, a.sugestao); else $("#sugestao").classList.add("oculto");
  $("#tg-ativa").classList.toggle("on", !!a.manterAtiva);
  if (a.equip && a.conectado) $("#aba-alvo").textContent = `${a.nome} · ${a.equip}`;
  desenharShare(a);
  setTimeout(() => { a.term.focus(); ajustarFonte(); arrumarAbas(); }, 0);
}

async function fecharAba(id) {
  const a = abas.get(id); if (!a) return;
  if (a.conectado) { await api.desconectar(id); if (["web", "ssh"].includes(a.tipo)) oferecerRemoverRede(); }
  a.term.dispose(); a.pane.remove(); a.btn.remove(); abas.delete(id);
  if (!abas.size) novaAba("serial");
  else if (ativa === id) ativar(ordemAbas().pop());
  arrumarAbas();
}

function setConectado(a, on, nome) {
  a.conectado = on;
  a.inicio = on ? (a.inicio && a.conectado ? a.inicio : Date.now()) : null;
  if (nome) a.nome = nome;
  if (!on) { a.loginPend = null; esconderSugestao(a); a.share = null; desenharShare(a); }
  a.btn.querySelector(".ponto").classList.toggle("on", on);
  desenharRec(a);
  a.btn.querySelector(".nome").textContent = on || a.nome !== "Nova aba" ? a.nome : "Nova aba";
  a.btn.title = a.nome;
  if (a.id === ativa) { atualizarBotaoConectar(); $("#aba-alvo").textContent = on ? a.nome : ""; }
  arrumarAbas();
}

// ---------- gravação por aba: REC vermelho = gravando · REC cinza riscado = sem gravar (clique para mudar) ----------
function desenharRec(a) {
  const r = a.btn && a.btn.querySelector(".rec"); if (!r) return;
  const mostra = a.conectado && a.tipo !== "web";   // aba Web não grava terminal
  r.classList.toggle("on", mostra && !!a.gravando);
  r.classList.toggle("off", mostra && !a.gravando);
  r.title = a.gravando ? "Gravando esta sessão — clique para parar ou assistir" : "Esta aba NÃO está gravando — clique para gravar";
}
function menuGravacao(a) {
  if (!a.conectado) return;
  if (a.mudandoRec) return toast("Aguarde — mudando a gravação desta aba…");
  const mudar = async (ligar) => {
    a.mudandoRec = true;
    a.gravando = ligar; desenharRec(a);   // resposta NA HORA no selo REC; o Python confirma em seguida
    toast(ligar ? "⏺ Gravando esta aba" : "⏸ Gravação parada — daqui em diante só o log em texto (leve)");
    try {
      const r = await api.gravacao_ligar(a.id, ligar);
      a.gravando = !!(r.ok ? r.gravando : !ligar); desenharRec(a);
      if (!r.ok) toast(r.erro, "erro");
    } finally { a.mudandoRec = false; }
  };
  const chave = "rec-" + a.id;   // um aviso por aba: cliques repetidos no REC não empilham
  if (a.gravando)
    pedido(`⏺ <b>${esc(a.nome)}</b> está sendo gravada.<br><small>Parar economiza espaço e deixa o PC mais leve; o log em texto continua.</small>`,
      "⏸ Parar gravação", "▶ Assistir até agora", async (parar) => {
        if (parar) return mudar(false);
        const g = await api.gravacao_aba(a.id); if (g) tocarGravacao(g, `${a.nome} — gravação até agora`);
      }, chave);
  else
    pedido(`○ <b>${esc(a.nome)}</b> não está gravando.<br><small>Gravar agora cria uma gravação nova a partir deste momento.</small>`,
      "⏺ Gravar agora", "Agora não", (sim) => sim && mudar(true), chave);
}

function atualizarBotaoConectar() {
  const a = A(), b = $("#conectar");
  b.textContent = a && a.conectado ? "Desconectar" : "Conectar";
  b.classList.toggle("perigo", !!(a && a.conectado));
}

// ================= conexão =================
function tipoTopo() { const b = document.querySelector("#abas button.ativa"); return b ? b.dataset.tipo : "serial"; }
function selecionarTipo(tipo, silencioso) {
  document.querySelectorAll("#abas button").forEach((x) => x.classList.toggle("ativa", x.dataset.tipo === tipo));
  $("#campos-serial").classList.toggle("oculto", tipo !== "serial");
  $("#campos-ssh").classList.toggle("oculto", tipo !== "ssh");
  $("#campos-web").classList.toggle("oculto", tipo !== "web");
  const a = A(); if (a && !silencioso) a.tipo = tipo;
}

async function conectar(a = A(), pularRede = false) {
  if (!a) return;
  if (a.demo) demoParar(a);   // conectar de verdade encerra a demonstração
  if (a.conectado) {
    await api.desconectar(a.id); setConectado(a, false); a.term.write("\r\n\x1b[90m[desconectado]\x1b[0m\r\n");
    if (["web", "ssh"].includes(a.tipo)) oferecerRemoverRede();   // fim da sessão: tira o IP temporário
    return;
  }
  if (a.tipo === "ssh" && !pularRede && $("#ssh-destino").value.trim()) {
    const av = await api.rede_avaliar($("#ssh-destino").value.trim(), [22]);
    if (av.ok && !av.alcanca) return abrirRede("ssh", () => conectar(a, true), av);
  }
  const tipo = a.tipo, porta = $("#porta").value, baud = $("#baud").value, destino = $("#ssh-destino").value.trim();
  if (tipo === "serial" && !porta) return toast("Conecte o cabo console e clique em ⟳", "aviso");
  if (tipo === "serial" && [...abas.values()].some((x) => x !== a && x.conectado && x.tipo === "serial" && x.alvo === porta))
    return toast(`A ${porta} já está aberta em outra aba`, "aviso");
  if (tipo === "ssh" && !destino) return toast("Informe usuario@ip", "aviso");
  if (tipo === "web") return conectarWeb(a);
  a.term.write("\x1bc");
  const r = await api.conectar(a.id, tipo, porta, baud, destino);
  if (!r.ok) {
    a.term.write(`\x1b[31m${r.erro}\x1b[0m\r\n`);
    if (tipo === "serial" && r.porta_ocupada) {   // porta presa: oferece destravar na hora (e reconecta sozinho)
      a.term.write(`\x1b[33mA ${porta} está ocupada ou travada — tentando liberar…\x1b[0m\r\n`);
      return liberarPorta(porta, a);
    }
    toast(r.erro, "erro");
    // problema típico de cabo/driver: já abre o diagnóstico com a correção
    if (tipo === "serial" && /31|não está funcionando|not functioning/i.test(r.erro)) {
      a.term.write("\x1b[33mAbrindo o diagnóstico do cabo…\x1b[0m\r\n"); diagnosticarCabo();
    }
    return;
  }
  a.alvo = r.alvo; a.params = { porta, baud, destino }; a.ultimoPrompt = ""; a.gravando = !!r.gravando;
  setConectado(a, true, r.nome); a.term.focus();
  if (tipo === "serial") api.escrever(a.id, "\r");  // mostra o prompt / tela de login
}

// ---------- 🔓 destravar porta COM (sem reiniciar o app e sem enviar nada ao equipamento) ----------
async function liberarPorta(porta = $("#porta").value, reconectarEm = null) {
  if (!porta) return toast("Escolha a porta COM", "aviso");
  const pronto = (msg) => {
    toast(msg);
    if (reconectarEm && abas.has(reconectarEm.id) && !reconectarEm.conectado) conectar(reconectarEm);
  };
  const r = await api.porta_liberar(porta);
  if (r.ok) return pronto(r.acao === "ja_livre" ? `A ${porta} está livre` : `🔓 ${porta} liberada (estava presa no app)`);
  if (r.aba) {
    const x = abas.get(r.aba);
    return pedido(`🔓 ${esc(r.erro)}<br><small>Uma porta COM só pode estar em uma aba por vez.</small>`, "Ir para a aba", "Desconectar ela",
      async (ir) => { if (ir) { if (x) ativar(x.id); return; } if (x) { await conectar(x); } setTimeout(() => liberarPorta(porta, reconectarEm), 600); });
  }
  if (r.programas && r.programas.length) {
    const p = r.programas[0];
    return pedido(`🔓 A <b>${esc(porta)}</b> parece estar com outro programa: <b>${esc(r.programas.map((x) => x.nome).join(", "))}</b>.<br>
      <small>Feche-o (o que estiver aberto nele será perdido) para o DASSH Console usar a porta.</small>`, `Fechar ${esc(p.nome)}`, "Cancelar",
      async (sim) => { if (!sim) return; const f = await api.porta_fechar_programa(p.pid, p.nome);
        if (!f.ok) return toast(f.erro || "Não foi possível fechar", "erro"); setTimeout(() => liberarPorta(porta, reconectarEm), 800); });
  }
  pedido(`🔓 A <b>${esc(porta)}</b> continua travada (nenhum programa conhecido está com ela).<br>
    <small>Posso <b>reiniciar o adaptador USB</b> pelo Windows — é o mesmo que tirar e pôr o cabo. Não troca o driver.
    O Windows vai pedir permissão.</small>`, "Reiniciar adaptador", "Cancelar", async (sim) => {
    if (!sim) return;
    toast("Reiniciando o adaptador USB…");
    const x = await api.porta_liberar(porta, "reiniciar");
    if (x.ok) { await carregarPortas(); return pronto(`🔓 ${porta} liberada (adaptador reiniciado)`); }
    toast(`Ainda travada: ${x.erro || ""} — tire e ponha o cabo USB`, "erro"); diagnosticarCabo();
  });
}

// ---------- aba Web: navegador controlado sobre a área do terminal ----------
async function conectarWeb(a, pularRede = false) {
  const url = $("#web-url").value.trim();
  if (!url) return toast("Informe o endereço do iDRAC / iLO / iBMC", "aviso");
  if (!pularRede) {  // equipamento não responde? oferece o IP temporário na faixa dele
    toast("Verificando a rede do equipamento…");
    const av = await api.rede_avaliar(url, [443, 80, 8443]);
    if (av.ok && !av.alcanca) return abrirRede("web", () => conectarWeb(a, true), av);
  }
  const el = $("#terminal").getBoundingClientRect(), barra = outerHeight - innerHeight;
  const rect = { x: screenX + el.left, y: screenY + barra + el.top, w: el.width, h: el.height };
  toast("Abrindo o navegador…");
  const r = await api.conectar(a.id, "web", null, null, url, rect);
  if (!r.ok) return toast(r.erro, "erro");
  a.alvo = r.alvo; a.params = { destino: url }; a.navegador = r.navegador;
  a.pane.classList.add("web"); a.painel = false; a.janelas = [];
  setConectado(a, true, r.nome);
  montarWeb(a); desenharWeb(a);
  toast(`${r.navegador} aberto DENTRO do DASSH Console — use 📸 / 📤 na barra acima da página`);
}

// ---------- janelas encaixadas: barra da aba Web, tela cheia e sincronização da posição ----------
function montarWeb(a) {
  if (a.pane.querySelector(".web-barra")) return;
  a.pane.insertAdjacentHTML("afterbegin", `<div class="web-barra">
      <span class="wb-host" title="Endereço">🌐 <b></b></span>
      <div class="wb-janelas"></div>
      <button class="btn mini primario" data-wb="cap" title="Salvar a evidência da janela à vista">📸 Capturar</button>
      <button class="btn mini" data-wb="env" title="Capturar e enviar ao WhatsApp">📤 Enviar</button>
      <button class="btn mini" data-wb="painel" title="Mostrar/ocultar o painel da aba (janelas, Java, última captura)">☰ Painel</button>
      <button class="btn mini" data-wb="cheia" title="Usar a tela inteira para o equipamento">⤢ Tela cheia</button>
    </div><div class="web-area"></div>`);
  const area = a.pane.querySelector(".web-area"), velho = a.pane.querySelector(".web-painel");
  if (velho) area.appendChild(velho);
  a.pane.querySelector("[data-wb=cap]").onclick = () => capturarWeb(a, false);
  a.pane.querySelector("[data-wb=env]").onclick = () => capturarWeb(a, true);
  a.pane.querySelector("[data-wb=painel]").onclick = () => { a.painel = !a.painel; desenharBarraWeb(a); if (a.painel) desenharWeb(a); };
  a.pane.querySelector("[data-wb=cheia]").onclick = () => telaCheia(!document.body.classList.contains("tela-cheia"));
  desenharBarraWeb(a);
}
function desenharBarraWeb(a) {
  const b = a.pane.querySelector(".web-barra"); if (!b) return;
  b.querySelector(".wb-host b").textContent = a.alvo || "";
  b.querySelector("[data-wb=painel]").classList.toggle("on", !!a.painel);
  b.querySelector("[data-wb=cheia]").innerHTML = document.body.classList.contains("tela-cheia") ? "↩ Voltar ao normal" : "⤢ Tela cheia";
  const j = b.querySelector(".wb-janelas");
  j.innerHTML = (a.janelas || []).map((x) => `<button class="wb-jan ${x.ativa ? "ativa" : ""}" data-h="${x.h}" title="${esc(x.titulo)}">
      ${x.java ? "☕" : "🗔"} ${esc((x.titulo || "Janela").slice(0, 28))}</button>`).join("");
  j.querySelectorAll("[data-h]").forEach((e) => (e.onclick = async () => {
    a.painel = false; await api.web_mostrar(a.id, +e.dataset.h); a.janelas = await api.web_janelas(a.id); desenharBarraWeb(a);
  }));
}
window.onJanelas = (sid, lista) => {
  const a = abas.get(sid); if (!a) return;
  const nova = (lista || []).length > (a.janelas || []).length;
  a.janelas = lista || []; if (nova) a.painel = false;
  desenharBarraWeb(a);
  if (nova && a.janelas.some((x) => x.ativa && x.java)) toast("☕ Console virtual (Java) aberto aqui dentro — capture pela barra 📸");
};
function capturarWeb(a, enviar) {
  const at = (a.janelas || []).find((x) => x.ativa);
  evidencia(enviar, "", a, "", at && at.java ? "java" : undefined);
}
async function telaCheia(on) {
  document.body.classList.toggle("tela-cheia", on);
  try { await api.tela_cheia(on); } catch (_) {}
  abas.forEach(desenharBarraWeb);
  if (on) toast("Tela cheia — clique em ↩ Voltar ao normal na barra para sair");
}
// a cada 0,3 s: diz ao Python onde fica a área da aba Web e se ela está à vista (some sob painéis/modais do app)
setInterval(() => {
  const sobre = document.querySelector(".modal:not(.oculto), .popover:not(.oculto), .tema-pop:not(.oculto), .menu-abas:not(.oculto)") ||
                ($("#pedidos") && $("#pedidos").children.length);
  abas.forEach((a) => {
    if (a.tipo !== "web" || !a.conectado) return;
    const area = a.pane.querySelector(".web-area"); if (!area) return;
    const el = area.getBoundingClientRect(), d = devicePixelRatio || 1;
    const rect = { x: Math.round(el.left * d), y: Math.round(el.top * d), w: Math.round(el.width * d), h: Math.round(el.height * d) };
    const vis = a.id === ativa && !sobre && !a.painel && el.width > 50 && !document.hidden;
    const chave = JSON.stringify([rect, vis]);
    if (chave !== a.ultLayout) { a.ultLayout = chave; api.web_layout(a.id, rect, vis); }
  });
}, 300);
window.onEquip = (sid, rot) => {   // modelo / nº de série reconhecidos sozinhos na tela
  const a = abas.get(sid); if (!a || !rot || a.equip === rot) return;
  a.equip = rot; toast("🏷 Equipamento identificado: " + rot);
  if (a.id === ativa) $("#aba-alvo").textContent = `${a.nome} · ${rot}`;
  a.btn.title = `${a.nome} — ${rot}`;
};
window.onJava = (sid, estado, msg) => {
  toast(msg, estado === "erro" ? "erro" : "");
  const a = abas.get(sid); if (!a) return;
  if (estado === "aberto") a.javaAtivo = true;
  desenharWeb(a);
};
async function desenharWeb(a) {
  let p = a.pane.querySelector(".web-painel");
  if (!p) { p = document.createElement("div"); p.className = "web-painel"; (a.pane.querySelector(".web-area") || a.pane).appendChild(p); }
  if (!a.conectado) { p.innerHTML = `<h3>🌐 Navegador fechado</h3><p class="url">Clique em Conectar para abrir de novo.</p>`; return; }
  const r = await api.web_paginas(a.id), pags = r.ok ? r.paginas : [];
  p.innerHTML = `<h3>🌐 ${esc(a.alvo || "")}</h3><div class="url">Navegador: ${esc(a.navegador || "")} · ${pags.length} janela(s)</div>
    <div class="web-acoes"><button class="btn primario" data-cap>📸 Capturar evidência <small>Ctrl+Alt+P</small></button>
      <button class="btn" data-env>📤 Capturar e enviar <small>Ctrl+Alt+E</small></button>
      <button class="btn" data-fr>🗔 Voltar ao navegador</button><button class="btn" data-at>⟳ Atualizar lista</button></div>
    ${a.javaAtivo ? `<ul class="web-janelas"><li class="ativa"><span>☕ Console Java do equipamento<br><small>aberto com o Java próprio do DASSH Console
      (sem Java instalado, sem lista de exceções)</small></span><button class="btn primario" data-java="0">📸 Capturar</button>
      <button class="btn" data-java="1">📤 Capturar e enviar</button></li></ul>` : ""}
    <ul class="web-janelas">${pags.map((g) => `<li class="${g.ativa ? "ativa" : ""}"><span>${esc(g.titulo)}<br><small>${esc(g.url)}</small></span>
      <button class="btn" data-capi="${g.i}">📸 Capturar esta</button><button class="btn" data-fri="${g.i}">Mostrar</button></li>`).join("")}</ul>
    <div class="web-dica">💡 O navegador e o <b>console virtual</b> (HTML5 ou Java) abrem <b>dentro do DASSH Console</b>, nesta área.
      Cada janela vira um botão na barra de cima — clique para alternar. 📸 captura a janela à vista. <b>⤢ Tela cheia</b> usa a tela
      inteira para o equipamento; <b>↩ Voltar ao normal</b> restaura. Certificados próprios desses equipamentos são aceitos.</div>
    ${a.ultimaWeb ? `<img class="web-ultima" src="${a.ultimaWeb}" alt="">` : ""}`;
  p.querySelector("[data-cap]").onclick = () => evidencia(false);
  p.querySelector("[data-env]").onclick = () => evidencia(true);
  p.querySelector("[data-fr]").onclick = () => { a.painel = false; desenharBarraWeb(a); };
  p.querySelector("[data-at]").onclick = () => desenharWeb(a);
  p.querySelectorAll("[data-capi]").forEach((b) => (b.onclick = () => evidencia(false, "", a, "", +b.dataset.capi)));
  p.querySelectorAll("[data-fri]").forEach((b) => (b.onclick = async () => {
    await api.web_frente(a.id, +b.dataset.fri); a.painel = false; a.janelas = await api.web_janelas(a.id); desenharBarraWeb(a);
  }));
  p.querySelectorAll("[data-java]").forEach((b) => (b.onclick = () => evidencia(b.dataset.java === "1", "", a, "", "java")));
}

async function carregarPortas(lista) {
  const sel = $("#porta"), atual = sel.value; sel.innerHTML = "";
  (lista || (await api.portas())).forEach((p) => {
    const o = document.createElement("option"); o.value = p.porta; o.textContent = `${p.porta} — ${p.descricao}`; sel.appendChild(o);
  });
  if (!sel.options.length) { const o = document.createElement("option"); o.textContent = "Nenhuma porta COM"; o.value = ""; sel.appendChild(o); }
  if ([...sel.options].some((o) => o.value === atual)) sel.value = atual;
}

// ================= cofre: detectar login e sugerir =================
function linhaCursor(term) {
  const b = term.buffer.active, ln = b.getLine(b.baseY + b.cursorY);
  return ln ? ln.translateToString(true) : "";
}
function verificarLogin(a) {
  if (!a.conectado) return;
  const txt = linhaCursor(a.term), b = a.term.buffer.active, chave = `${b.baseY + b.cursorY}|${txt}`;
  const user = RE_USER.test(txt), pass = !user && RE_PASS.test(txt);
  if (!user && !pass) { if (a.sugestao) esconderSugestao(a); return; }  // o prompt de login passou
  if (chave === a.ultimoPrompt) return;
  a.ultimoPrompt = chave;
  if (pass && a.loginPend && Date.now() - a.loginPend.t < 30000) {  // usuário veio do cofre: completa a senha
    const id = a.loginPend.id; a.loginPend = null;
    api.cofre_preencher(a.id, id, "senha").then((r) => r.ok ? toast("Senha preenchida pelo cofre") : toast(r.erro, "erro"));
    esconderSugestao(a); return;
  }
  mostrarSugestao(a, user ? "usuario" : "senha");
}
function ordenarCofre(a, modo) {
  const alvo = (a.alvo || "").toLowerCase();
  return cofre.filter((c) => modo !== "usuario" || c.usuario)
    .map((c) => ({ c, s: c.alvo && alvo && (alvo.includes(c.alvo.toLowerCase()) || c.alvo.toLowerCase().includes(alvo)) ? 0 : c.alvo ? 2 : 1 }))
    .sort((x, y) => x.s - y.s || x.c.nome.localeCompare(y.c.nome)).map((x) => x.c);
}
function mostrarSugestao(a, modo) {
  a.sugestao = modo;
  if (a.id !== ativa) { a.btn.classList.add("alerta"); return; }
  $("#sug-tit").textContent = modo === "usuario" ? "🔑 Pediu usuário" : "🔑 Pediu senha";
  const box = $("#sug-itens"); box.innerHTML = "";
  ordenarCofre(a, modo).slice(0, 6).forEach((c) => {
    const bt = document.createElement("button");
    bt.innerHTML = `${esc(c.nome)}<small>${esc(modo === "usuario" ? c.usuario : c.usuario ? c.usuario : "senha")}</small>`;
    bt.onclick = async () => {
      const r = await api.cofre_preencher(a.id, c.id, modo);
      if (!r.ok) return toast(r.erro, "erro");
      if (modo === "usuario") a.loginPend = { id: c.id, t: Date.now() }; else toast("Senha preenchida pelo cofre");
      esconderSugestao(a); a.term.focus();
    };
    box.appendChild(bt);
  });
  const g = document.createElement("button"); g.className = "gerenciar";
  g.textContent = cofre.length ? "Gerenciar cofre" : "Adicionar ao cofre"; g.onclick = abrirCofre; box.appendChild(g);
  $("#sugestao").classList.remove("oculto");
}
function esconderSugestao(a) {
  a.sugestao = null; a.btn && a.btn.classList.remove("alerta");
  if (a.id === ativa) $("#sugestao").classList.add("oculto");
}

// ================= cofre: tela de gerenciamento =================
function desenharCofre() {
  const tb = $("#cofre-linhas"); tb.innerHTML = "";
  const [ini, fim, p] = paginador($("#cofre-pag"), cofre.length, desenharCofre.pag || 0, (n) => { desenharCofre.pag = n; desenharCofre(); }, "credencial(is)");
  desenharCofre.pag = p;
  if (!cofre.length) { tb.innerHTML = `<tr class="vazio"><td colspan="4">Nenhuma credencial ainda.</td></tr>`; return; }
  cofre.slice(ini, fim).forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${esc(c.nome)}</td><td>${esc(c.usuario) || "<i>—</i>"}</td><td>${esc(c.alvo) || "<i>qualquer</i>"}</td>
      <td style="text-align:right"><button class="btn" data-ed>Editar</button><button class="btn" data-rm>Excluir</button></td>`;
    tr.querySelector("[data-ed]").onclick = () => {
      $("#cf-id").value = c.id; $("#cf-nome").value = c.nome; $("#cf-usuario").value = c.usuario;
      $("#cf-senha").value = ""; $("#cf-alvo").value = c.alvo; $("#cofre-form-tit").textContent = "Editar credencial";
    };
    tr.querySelector("[data-rm]").onclick = async () => {
      if (tr.dataset.conf !== "1") { tr.dataset.conf = "1"; tr.querySelector("[data-rm]").textContent = "Confirmar?"; return; }
      cofre = await api.cofre_remover(c.id); desenharCofre();
    };
    tb.appendChild(tr);
  });
}
function limparFormCofre() {
  ["#cf-id", "#cf-nome", "#cf-usuario", "#cf-senha", "#cf-alvo"].forEach((s) => ($(s).value = ""));
  $("#cofre-form-tit").textContent = "Nova credencial";
}
async function abrirCofre() {
  cofre = await api.cofre_listar(); desenharCofre(); limparFormCofre();
  const a = A(); if (a && a.alvo) $("#cf-alvo").value = a.alvo;
  abrirModal("#modal-cofre"); $("#cf-nome").focus();
}

// ================= histórico de sessões =================
function duracao(ini, fim) {
  if (!fim) return "<span style='color:var(--verde-cl)'>em andamento</span>";
  const s = Math.max(0, (new Date(fim.replace(" ", "T")) - new Date(ini.replace(" ", "T"))) / 1000);
  return s < 60 ? `${Math.round(s)} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}
// ================= paginação PADRÃO (todas as listas que crescem): 20 por página, mesmo visual =================
const POR_PAG = 20;
function paginador(el, total, pag, ir, rotulo = "item(ns)") {
  const paginas = Math.max(1, Math.ceil(total / POR_PAG)), p = Math.min(Math.max(0, pag), paginas - 1);
  el.className = "paginas";
  el.innerHTML = paginas > 1 ? `<button class="btn mini" data-p="${p - 1}" ${p ? "" : "disabled"}>‹ Anterior</button>
      <span>Página <b>${p + 1}</b> de ${paginas} · ${total} ${rotulo}</span>
      <button class="btn mini" data-p="${p + 1}" ${p < paginas - 1 ? "" : "disabled"}>Próxima ›</button>`
    : total ? `<span>${total} ${rotulo}</span>` : "";
  el.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => ir(+b.dataset.p)));
  return [p * POR_PAG, (p + 1) * POR_PAG, p];
}
// confirmação padrão de exclusão (sempre para a Lixeira)
const confirmarExclusao = (oque, cb) => pedido(`🗑 Excluir <b>${oque}</b>?<br><small>Vai para a <b>Lixeira</b> do Windows — dá para recuperar de lá.</small>`,
  "🗑 Excluir", "Cancelar", (sim) => sim && cb(), "excluir");

let HIST = [], histPag = 0;
async function abrirHistorico() { HIST = await api.historico(); histPag = 0; desenharHist(); abrirModal("#modal-hist"); }
function desenharHist() {
  const tb = $("#hist-linhas"); tb.innerHTML = "";
  const [ini, fim, p] = paginador($("#hist-pag"), HIST.length, histPag, (n) => { histPag = n; desenharHist(); }, "sessão(ões)");
  histPag = p;
  if (!HIST.length) tb.innerHTML = `<tr class="vazio"><td colspan="5">Nenhuma sessão registrada ainda.</td></tr>`;
  HIST.slice(ini, fim).forEach((r) => {
    const [d, t] = r.inicio.split(" "), [y, m, dd] = d.split("-");
    const ev = r.evidencias && r.evidencias.length ? r.evidencias.map((n) => "Nº " + pad2(n)).join(", ") : "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${dd}/${m} ${t.slice(0, 5)}</td><td><span class="tipo">${NOMES_TIPO[r.tipo] || r.tipo}</span>${esc(r.nome)}</td>
      <td>${duracao(r.inicio, r.fim)}</td><td>${ev}</td>
      <td style="text-align:right;white-space:nowrap"><button class="btn" data-rc>Reconectar</button>
        <button class="btn" data-grav ${r.grav_existe ? "" : "disabled"}>▶ Gravação</button>
        <button class="btn" data-log ${r.log_existe ? "" : "disabled"}>Log</button>
        <button class="btn" data-x title="${r.ativa ? "Sessão aberta agora — desconecte antes" : "Excluir gravação e logs (vão para a Lixeira)"}" ${r.ativa ? "disabled" : ""}>🗑</button></td>`;
    tr.querySelector("[data-rc]").onclick = () => reconectar(r);
    tr.querySelector("[data-grav]").onclick = () => tocarGravacao(r.gravacao, `${r.nome} — ${dd}/${m} ${t.slice(0, 5)}`);
    tr.querySelector("[data-log]").onclick = () => api.abrir_arquivo(r.log);
    tr.querySelector("[data-x]").onclick = () => confirmarExclusao(`a sessão ${esc(r.nome)} de ${dd}/${m} ${t.slice(0, 5)} (gravação e logs)`, async () => {
      const x = await api.hist_excluir(r.id);
      if (!x.ok) return toast(x.erro, "erro");
      toast(`🗑 Sessão excluída — ${x.arquivos} arquivo(s) na Lixeira`);
      HIST = await api.historico(); desenharHist();
    });
    tb.appendChild(tr);
  });
}

// ---------- 🖼 todas as evidências do atendimento: ver, abrir, excluir (com páginas) ----------
let EVS = [], evPag = 0;
async function abrirEvidencias() {
  const r = await api.evid_lista(); if (!r.ok) return toast(r.erro, "erro");
  EVS = r.itens; evPag = 0; desenharEvidencias(); abrirModal("#modal-evid");
}
function desenharEvidencias() {
  const g = $("#ev-grade");
  const [ini, fim, p] = paginador($("#ev-pag"), EVS.length, evPag, (n) => { evPag = n; desenharEvidencias(); }, "evidência(s)");
  evPag = p;
  g.innerHTML = EVS.length ? "" : `<p class="vazio">Nenhuma evidência neste atendimento ainda.</p>`;
  EVS.slice(ini, fim).forEach((e) => {
    const c = document.createElement("div"); c.className = "ev-card";
    const dh = (e.data_hora || "").slice(0, 16).replace("T", " ");
    c.innerHTML = `<div class="ev-mini"><img alt=""></div><div class="ev-info"><b>Nº ${pad2(e.num || 0)}</b> <small>${esc(e.id || "")}</small>
        <span>${esc(e.comando || e.host || e.arquivo)}</span><small>${esc(dh)}${e.serial ? " · SN " + esc(e.serial) : ""}</small></div>
      <div class="ev-acoes"><button class="btn mini" data-v>Ver</button><button class="btn mini" data-x title="Excluir (vai para a Lixeira)">🗑</button></div>`;
    api.miniatura(e.caminho).then((m) => { if (m) c.querySelector("img").src = m; });
    c.querySelector("[data-v]").onclick = () => verEvidencia({ ...e, cmd: e.comando, mini: "" }, null);
    c.querySelector("[data-x]").onclick = () => excluirEvidencia(e);
    g.appendChild(c);
  });
}
function excluirEvidencia(e, depois) {
  confirmarExclusao(`a evidência Nº ${pad2(e.num || 0)} (${esc(e.arquivo)})`, async () => {
    const x = await api.evid_excluir(e.caminho);
    if (!x.ok) return toast(x.erro, "erro");
    toast(`🗑 Evidência Nº ${pad2(e.num || 0)} na Lixeira — exclusão registrada no manifesto de custódia`);
    if (x.evid) atualizarEvid(x.evid);
    document.querySelectorAll("#historico li.ev-item").forEach((li) => { if (li.dataset.arq === e.caminho) li.classList.add("excluida"); });
    if (depois) depois();
    if (!$("#modal-evid").classList.contains("oculto")) { const r = await api.evid_lista(); EVS = r.itens || []; desenharEvidencias(); }
  });
}
async function reconectar(r) {
  $("#modal-hist").classList.add("oculto");
  let a = A();
  if (!a || a.conectado) a = novaAba(r.tipo); else { a.tipo = r.tipo; selecionarTipo(r.tipo); }
  if (r.tipo === "serial") { await carregarPortas(); $("#porta").value = r.alvo; $("#baud").value = String(r.baud || 9600); }
  if (r.tipo === "ssh") $("#ssh-destino").value = r.alvo;
  if (r.tipo === "web") $("#web-url").value = r.alvo;
  conectar(a);
}

// ================= evidências =================
function cor(cell, fg) {
  if (fg ? cell.isFgDefault() : cell.isBgDefault()) return fg ? TEMA.foreground : TEMA.background;
  const v = fg ? cell.getFgColor() : cell.getBgColor();
  if (fg ? cell.isFgPalette() : cell.isBgPalette()) return PALETA[v] || (fg ? TEMA.foreground : TEMA.background);
  return "#" + v.toString(16).padStart(6, "0");
}
function snapshot(term) {
  const b = term.buffer.active, linhas = [];
  for (let y = 0; y < term.rows; y++) {
    const ln = b.getLine(b.viewportY + y), runs = [];
    let cur = null;
    for (let x = 0; x < term.cols; x++) {
      const c = ln && ln.getCell(x);
      if (c && c.getWidth() === 0) continue;
      const ch = (c && c.getChars()) || " ", bold = !!(c && c.isBold());
      let fg = c ? cor(c, true) : TEMA.foreground, bg = c ? cor(c, false) : TEMA.background;
      if (c && c.isInverse()) [fg, bg] = [bg, fg];
      if (cur && cur[1] === fg && cur[2] === bg && cur[3] === bold) cur[0] += ch;
      else { cur = [ch, fg, bg, bold]; runs.push(cur); }
    }
    linhas.push(runs);
  }
  const ini = Math.max(0, b.length - 400), txt = [];
  for (let i = ini; i < b.length; i++) {   // junta linhas quebradas pelo terminal (comandos longos)
    const ln = b.getLine(i);
    if (ln.isWrapped && txt.length) txt[txt.length - 1] += ln.translateToString(true); else txt.push(ln.translateToString(true));
  }
  return { cols: term.cols, rows: term.rows, bg: TEMA.background, fg: TEMA.foreground, linhas,
           texto: txt.join("\n"), cursor: { x: b.cursorX, y: b.baseY + b.cursorY - b.viewportY } };
}
function limpar() {
  const a = A(); if (!a) return;
  if (a.tipo === "web") return toast("Na aba Web não há tela para limpar — use 📸 Capturar", "aviso");
  a.term.clear(); a.term.focus(); toast("Tela limpa");
}

// Captura: a tela é "fotografada" NO INSTANTE do clique (snapshot) e entra numa fila local de processamento,
// em ordem. Nenhum clique é descartado, por mais rápido que seja. O envio ao WhatsApp vai para a fila do
// backend (um por vez, em segundo plano, salva em disco) — a captura nunca espera o WhatsApp.
let filaCaptura = Promise.resolve(), capturasPendentes = 0;
let LIMPAR_APOS = true;   // 🧹 limpar a tela depois de cada evidência (configurável no cartão Evidência)
function evidencia(enviar, roteiro = "", aba = null, comando = "", indiceWeb = null) {
  const a = aba || A(); if (!a) return Promise.resolve();
  if (a.demo) { toast("🎬 Aba de demonstração: é uma simulação — não gera evidência", "aviso"); return Promise.resolve(); }
  if (a.tipo === "web" && !a.conectado) { toast("Conecte a aba Web primeiro", "aviso"); return Promise.resolve(); }
  const snap = a.tipo === "web" ? null : snapshot(a.term);
  capturasPendentes++;
  const p = filaCaptura.then(() => processarCaptura(a, snap, enviar, roteiro, comando, indiceWeb)).finally(() => capturasPendentes--);
  filaCaptura = p.catch(() => {});
  return p;
}
const ENVIOS = new Map();   // job -> <li> da lista de últimas evidências
async function processarCaptura(a, snap, enviar, roteiro, comando, indiceWeb) {
  try {
    const r = a.tipo === "web" ? (indiceWeb === "java" ? await api.java_evidencia(a.id, enviar)   // console Java
                                                      : await api.web_evidencia(a.id, enviar, indiceWeb))   // página / console remoto
                               : await api.evidencia(a.id, snap, enviar, roteiro, comando);
    if (!r.ok) { toast(r.erro, "erro"); return; }
    if (a.tipo === "web") { a.ultimaWeb = r.mini; desenharWeb(a); }
    atualizarEvid(r.evid);
    let st = "salva", cls = "";
    if (enviar) {
      if (r.enviado && r.enviado.fila) { st = "na fila"; cls = "fila"; toast(`Evidência nº ${pad2(r.num)} salva e na fila de envio (${r.enviado.posicao}º)`); }
      else { st = "não enviada"; cls = "erro"; toast(`Nº ${pad2(r.num)} salva e copiada, mas NÃO enviada: ${(r.enviado && r.enviado.erro) || "erro"}`, "erro"); }
    } else toast(`Evidência nº ${pad2(r.num)} salva e copiada (Ctrl+V no WhatsApp)`);
    const ul = $("#historico"), v = ul.querySelector(".vazio"); if (v) v.remove();
    // tela limpa para o próximo comando (Salvar e Enviar, botão ou atalho) — não vale para automações e aba Web
    if (LIMPAR_APOS && !roteiro && a.tipo !== "web" && a.conectado) {
      // "cls" só quando o cursor está no PROMPT do shell: com um programa rodando na aba (ex.: Claude Code, vim, top)
      // o texto iria para o programa — nesse caso limpa só a tela do app
      const noPrompt = /^\s*(PS [^>]*>|[A-Za-z]:\\[^>]*>)\s*$/.test(linhaCursor(a.term)) && a.term.buffer.active.type !== "alternate";
      if (SHELL_WIN.includes(a.tipo) && noPrompt) api.escrever(a.id, "cls\r"); else a.term.clear();
    }
    const li = document.createElement("li"); li.className = "ev-item";
    li.innerHTML = `<img class="mini" alt=""><div class="ev-txt"><b>Nº ${pad2(r.num)}</b><span></span></div><i class="${cls}">${st}</i>`;
    li.querySelector("img").src = r.mini || "";
    li.querySelector("span").textContent = r.cmd || r.host; li.title = `${a.nome} — ${r.arquivo} — clique para ampliar`;
    li.onclick = () => verEvidencia(r, li);
    if (r.enviado && r.enviado.job) { ENVIOS.set(r.enviado.job, li); li.dataset.job = r.enviado.job; }
    ul.prepend(li); while (ul.children.length > 30) ul.lastChild.remove();
  } catch (e) { toast("Falha: " + e, "erro"); }
}
window.onEnvio = (job, estado, msg) => {
  const li = ENVIOS.get(job);
  const rot = { enviando: ["enviando…", "fila"], enviada: ["enviada", "ok"], "tentando de novo": ["tentando…", "fila"],
                falhou: ["falhou ↻", "erro"], aguardando: ["aguardando WhatsApp", "fila"] }[estado] || [estado, ""];
  if (li) { const i = li.querySelector("i"); i.textContent = rot[0]; i.className = rot[1]; i.title = msg || ""; }
  if (estado === "falhou") toast(`Envio falhou após 3 tentativas: ${msg || ""} — clique na evidência para reenviar`, "erro");
  if (estado === "aguardando") toast(msg, "aviso");
};
let FALHAS = [], FILA = { pendentes: 0, jobs: [], falhas: [], atual: null }, filaTimer = null;
const rotuloJob = (j) => j.tipo === "texto" ? `✉ Convite para a sessão ao vivo` : j.tipo === "doc" ? `📄 ${(j.legenda || "Relatório").slice(0, 60)}` : `🖼 Evidência nº ${pad2(j.num || 0)}`;
window.onFila = (f) => {
  FILA = f; FALHAS = f.falhas || [];
  const el = $("#wa-fila"), and = $("#wa-andamento");
  const n = f.pendentes + FALHAS.length;
  el.textContent = f.pendentes ? `Fila: ${f.pendentes}` : (FALHAS.length ? `Falhas: ${FALHAS.length}` : "");
  el.classList.toggle("oculto", !n);
  // linha de andamento: o que está acontecendo AGORA + progresso do lote
  const a = f.atual, L = f.lote || { total: 0, feitos: 0 }, pct = L.total ? Math.round((L.feitos / L.total) * 100) : 0;
  const barra = L.total > 1 ? `<span class="fila-barra"><i style="width:${pct}%"></i></span>` : "";
  if (a && a.estado === "enviando") {
    and.className = "wa-andamento enviando";
    and.innerHTML = `<span class="giro"></span>Enviando ${esc(rotuloJob(a))}… ${a.segundos || 0}s` +
      (L.total > 1 ? ` · ${L.feitos} de ${L.total} (${pct}%)` : "") + barra;
  } else if (a && a.estado === "aguardando") {
    and.className = "wa-andamento";
    and.innerHTML = `⏳ ${f.pendentes} na fila — abra o WhatsApp`;
  } else if (FALHAS.length) {
    and.className = "wa-andamento erro"; and.innerHTML = `⚠ ${FALHAS.length} envio(s) falharam — clique para reenviar`;
  } else if (f.pendentes) {
    and.className = "wa-andamento"; and.innerHTML = `⏳ ${f.pendentes} na fila…`;
  } else and.className = "wa-andamento oculto";
  // enquanto houver envio em andamento, atualiza o cronômetro a cada segundo
  clearTimeout(filaTimer);
  if (f.pendentes) filaTimer = setTimeout(async () => onFila(await api.fila_status()), 1000);
  if (!$("#modal-fila").classList.contains("oculto")) desenharFila();
};
function desenharFila() {
  const f = FILA, tb = $("#fila-linhas"); tb.innerHTML = "";
  const a = f.atual, L = f.lote || { total: 0, feitos: 0 }, pct = L.total ? Math.round((L.feitos / L.total) * 100) : 0;
  $("#fila-agora").innerHTML = (a && a.estado === "enviando"
    ? `<b style="color:var(--verde-cl)">Agora:</b> enviando ${esc(rotuloJob(a))} há ${a.segundos || 0}s (tentativa ${(a.tentativas || 0) + 1} de 3)`
    : a && a.estado === "aguardando" ? `<b style="color:var(--aviso)">Agora:</b> aguardando o WhatsApp — clique em <b>Abrir WhatsApp</b>`
    : f.pendentes ? "Preparando o próximo envio…" : `<b style="color:var(--verde-cl)">Tudo enviado.</b> Nada na fila.`) +
    (L.total ? `<div style="margin-top:6px;display:flex;gap:10px;align-items:center"><span class="fila-barra" style="flex:1;height:8px">` +
      `<i style="width:${pct}%"></i></span><b>${L.feitos} de ${L.total} (${pct}%)</b></div>` : "");
  const linhas = [...f.jobs.map((j, i) => ({ ...j, pos: i + 1, sit: a && a.id === j.id && a.estado === "enviando" ? "env" : "esp" })),
                  ...FALHAS.map((j) => ({ ...j, pos: "—", sit: "err" }))];
  if (!linhas.length) tb.innerHTML = `<tr class="vazio"><td colspan="4">Fila vazia.</td></tr>`;
  const [ini, fim, p] = paginador($("#fila-pag"), linhas.length, desenharFila.pag || 0, (n) => { desenharFila.pag = n; desenharFila(); }, "envio(s)");
  desenharFila.pag = p;
  linhas.slice(ini, fim).forEach((j) => {
    const tr = document.createElement("tr");
    const sit = { env: `<span class="chip env">enviando…</span>`, esp: `<span class="chip esp">na fila${j.tentativas ? ` · ${j.tentativas} falha(s)` : ""}</span>`,
                  err: `<span class="chip err">falhou</span>` }[j.sit];
    tr.innerHTML = `<td>${j.pos}</td><td>${esc(rotuloJob(j))}${j.erro ? `<br><small style="color:var(--erro)">${esc(j.erro)}</small>` : ""}</td><td>${sit}</td>
      <td style="text-align:right;white-space:nowrap">${j.sit === "err" ? `<button class="btn" data-re>↻ Reenviar</button>` : ""}
      ${j.sit !== "env" ? `<button class="btn" data-rm>Remover</button>` : ""}</td>`;
    const re = tr.querySelector("[data-re]"), rm = tr.querySelector("[data-rm]");
    if (re) re.onclick = async () => { await api.reenviar(j.id); onFila(await api.fila_status()); };
    if (rm) rm.onclick = async () => { await api.remover_envio(j.id); onFila(await api.fila_status()); };
    tb.appendChild(tr);
  });
}
async function abrirFila() { onFila(await api.fila_status()); desenharFila(); abrirModal("#modal-fila"); }
async function verEvidencia(r, li) {
  $("#lb-img").src = r.mini || ""; $("#lb-tit").textContent = `Evidência nº ${pad2(r.num)} — ${r.id || ""} — ${r.cmd || r.host}`;
  $("#lb-arq").textContent = r.arquivo;
  const job = li && li.dataset.job, falhou = FALHAS.some((f) => f.id === job);
  $("#lb-reenviar").classList.toggle("oculto", !falhou);
  $("#lb-reenviar").onclick = async () => { if (await api.reenviar(job)) { toast("Reenviando…"); $("#modal-lb").classList.add("oculto"); } };
  $("#lb-pasta").onclick = () => api.abrir_pasta();
  $("#lb-abrir").onclick = () => api.abrir_arquivo(r.caminho);
  $("#lb-excluir").onclick = () => excluirEvidencia({ ...r, arquivo: r.arquivo || (r.caminho || "").split("\\").pop() },
                                                     () => $("#modal-lb").classList.add("oculto"));
  abrirModal("#modal-lb");
  const full = await api.imagem(r.caminho); if (full) $("#lb-img").src = full;   // troca a miniatura pela imagem cheia
}

// ================= painéis =================
function atualizarEvid(e) {
  if (!e) return;
  if (!e.ok) { $("#visita-nome").textContent = e.erro; return; }
  $("#visita-nome").textContent = e.visita_nome; $("#visita-nome").parentElement.title = e.visita;
  $("#proximo").textContent = "Nº " + pad2(e.proximo);
  const sel = $("#cliente-sel"); if (sel.value !== e.cliente_nome && [...sel.options].some((o) => o.value === e.cliente_nome)) sel.value = e.cliente_nome;
  // dados do atendimento: chamado/mudança vai no rodapé de cada evidência e no relatório
  const ch = e.info && e.info.chamado;
  $("#renomear-visita").innerHTML = ch ? `✎ <span class="chamado-tag">Chamado ${esc(ch)}</span>`
    : "✎ nome e nº do chamado";
  ULTIMO_EVID = e;
}
let ULTIMO_EVID = null;
function desenharClientes(c) {
  const sel = $("#cliente-sel"); sel.innerHTML = "";
  c.clientes.forEach((n) => { const o = document.createElement("option"); o.value = n; o.textContent = n; sel.appendChild(o); });
  sel.value = c.atual; sel.title = c.raiz + "\\" + c.atual;
}

// formulário rápido (modal) -> Promise com os valores ou null
function pedir(titulo, campos, ok = "Salvar") {
  return new Promise((res) => {
    $("#fr-tit").textContent = titulo; $("#fr-ok").textContent = ok;
    $("#fr-campos").innerHTML = campos.map((c) =>
      `<label>${esc(c.label)} <input id="fr-${c.id}" value="${esc(c.valor || "")}" placeholder="${esc(c.ph || "")}" ${c.max ? `maxlength="${c.max}"` : ""}></label>`).join("");
    const m = $("#modal-form"), f = $("#form-rapido");
    const fim = (v) => { m.classList.add("oculto"); f.onsubmit = null; m.querySelectorAll("[data-fecha]").forEach((b) => (b.onclick = null)); res(v); };
    f.onsubmit = (e) => { e.preventDefault(); fim(Object.fromEntries(campos.map((c) => [c.id, $("#fr-" + c.id).value.trim()]))); };
    m.querySelectorAll("[data-fecha]").forEach((b) => (b.onclick = () => fim(null)));
    m.classList.remove("oculto"); setTimeout(() => $("#fr-" + campos[0].id).focus(), 30);
  });
}
async function novoCliente() {
  const v = await pedir("Novo cliente", [{ id: "sigla", label: "Sigla", ph: "ex.: CEF, TRT1, PETRO", max: 12 },
                                         { id: "nome", label: "Nome", ph: "ex.: Caixa Econômica Federal" }], "Criar pasta");
  if (!v) return;
  const r = await api.novo_cliente(v.sigla, v.nome);
  if (!r.ok) return toast(r.erro, "erro");
  desenharClientes(r); atualizarEvid(r.evid); toast(`Cliente criado: ${r.atual}`);
}
// ＋ Nova visita: outro atendimento hoje (ex.: um por equipamento), com pasta e PDF próprios
async function novaVisita() {
  const v = await pedir("Nova visita hoje (pasta e relatório próprios)", [
    { id: "desc", label: "Nome da visita", ph: "ex.: SW4 – coleta PoE para a Huawei" },
    { id: "chamado", label: "Nº do chamado / mudança (opcional)", ph: "ex.: INC0012345" }]);
  if (!v || !v.desc) return;
  const r = await api.nova_visita(v.desc);
  if (!r.ok) return toast(r.erro, "erro");
  if (v.chamado) { const x = await api.dados_visita(v.desc, v.chamado, ""); if (x.ok) r.evid = x.evid; }
  atualizarEvid(r.evid);
  $("#historico").innerHTML = `<li class="vazio">Nenhuma ainda nesta visita</li>`;
  toast(`📁 Nova visita: ${r.evid.visita_nome}` + (r.conectadas.length ? " — reconecte a aba para o log também ir para ela" : ""));
}
async function renomearVisita() {
  const atual = ($("#visita-nome").textContent || "").replace(/^\d{4}-\d{2}-\d{2} - /, "");
  const info = (ULTIMO_EVID && ULTIMO_EVID.info) || {};
  const v = await pedir("Dados do atendimento de hoje", [
    { id: "desc", label: "Descrição (nome da pasta)", valor: atual === "Atendimento" ? "" : atual, ph: "ex.: Troca SW agência Centro" },
    { id: "chamado", label: "Nº do chamado / mudança (vai em cada evidência)", valor: info.chamado || "", ph: "ex.: INC0012345, CHG0004567, RDM 2026/118" },
    { id: "resp", label: "Responsável no cliente (para o aceite do relatório)", valor: info.responsavel || "", ph: "ex.: Fulano — Gerência de Redes" }]);
  if (!v) return;
  const r = await api.dados_visita(v.desc, v.chamado, v.resp);
  if (!r.ok) return toast(r.erro, "erro");
  atualizarEvid(r.evid); toast("Atendimento: " + r.evid.visita_nome + (v.chamado ? " · Chamado " + v.chamado : ""));
}
function atualizarWa(s) {
  if (s && s.ocupado) return;  // WhatsApp enviando: mantém o status atual
  const st = $("#wa-status");
  if (s && s.aberto) { st.textContent = s.logado ? "conectado" : "leia o QR code"; st.className = "status-wa " + (s.logado ? "ok" : "aviso"); }
  else { st.textContent = "fechado"; st.className = "status-wa"; }
  const c = $("#conversa");
  if (s && s.conversa) { c.textContent = s.conversa; c.classList.add("ok"); } else { c.textContent = "Nenhuma conversa conectada"; c.classList.remove("ok"); }
}

// ================= compartilhamento ao vivo =================
let MODO_TESTE = "";
async function garantirNome() {
  let ok = false; try { ok = localStorage.getItem("dassh_nome_ok") === "1"; } catch (_) {}
  if (ok && NOME) return true;
  if (MODO_TESTE) return true;
  const v = await pedir("Seu nome (aparece para quem estiver na sessão)", [{ id: "nome", label: "Nome", valor: NOME, max: 40 }], "Continuar");
  if (!v || !v.nome) return false;
  NOME = v.nome; await api.salvar_pref("nome", NOME);
  try { localStorage.setItem("dassh_nome_ok", "1"); } catch (_) {}
  return true;
}
function avisoControle(a) {
  const agora = Date.now(); if (agora - (a._avisoT || 0) < 2500) return; a._avisoT = agora;
  if (a.share.aguardando) return toast("Aguardando o dono da sessão aprovar a sua entrada…", "aviso");
  const quem = (a.share.participantes || []).find((p) => p.ativo);
  toast(a.share.papel === "dono"
    ? `${quem ? quem.nome : "Um convidado"} está com o controle — clique em “Retomar controle” para digitar`
    : "Você está só observando — clique em “Pedir controle” para digitar", "aviso");
}
// Aviso com 2 botões + ✕ (fecha sem fazer nada). "chave": o mesmo assunto nunca empilha — um clique repetido
// só destaca o aviso que já está aberto. Depois de escolher, o aviso some na hora (sem esperar a ação terminar).
function pedido(html, sim, nao, cb, chave) {
  if (chave) {
    const ja = document.querySelector(`#pedidos .pedido[data-chave="${CSS.escape(chave)}"]`);
    if (ja) { ja.classList.remove("piscar"); void ja.offsetWidth; ja.classList.add("piscar"); return; }
  }
  const el = document.createElement("div"); el.className = "pedido"; if (chave) el.dataset.chave = chave;
  el.innerHTML = `<button class="pedido-x" title="Fechar sem fazer nada">✕</button><p>${html}</p>
    <div class="linha-btn"><button class="btn" data-n>${nao}</button><button class="btn primario" data-s>${sim}</button></div>`;
  let feito = false;
  const fim = (v) => { if (feito) return; feito = true; el.remove(); if (v !== null) cb(v); };
  el.querySelector("[data-s]").onclick = () => fim(true); el.querySelector("[data-n]").onclick = () => fim(false);
  el.querySelector(".pedido-x").onclick = () => fim(null);
  $("#pedidos").appendChild(el);
  try { new AudioContext().resume(); } catch (_) {}
  if (MODO_TESTE === "share-host" || MODO_TESTE === "demo-dono") setTimeout(() => fim(true), 300);  // autoteste: aprova sozinho
}
window.onShare = (sid, tipo, d) => {
  const a = abas.get(sid); if (!a) return;
  if (tipo === "estado") return atualizarEstadoShare(a, d);
  if (tipo === "pedido_entrada")
    return pedido(`🔗 <b>${esc(d.nome)}</b> quer entrar na sessão <b>${esc(a.nome)}</b> e ver a tela ao vivo.`, "Permitir", "Recusar",
      async (ok) => { await api.share_responder(sid, d.id, ok); if (ok) { api.share_tela(sid, d.id, a.ser.serialize()); toast(`${d.nome} entrou (observando)`); } });
  if (tipo === "pedido_controle")
    return pedido(`⌨️ <b>${esc(d.nome)}</b> pediu o controle de <b>${esc(a.nome)}</b>. Ele vai digitar e você fica observando (pode retomar a qualquer momento).`,
      "Passar controle", "Negar", (ok) => ok && api.share_controle(sid, d.id));
  if (tipo === "saiu") return toast(`${d.nome} saiu da sessão (${d.motivo})`, "aviso");
  if (tipo === "aprovado") { a.share = { ...(a.share || {}), aguardando: false }; toast("Entrada aprovada — você está observando"); desenharShare(a); }
};
function atualizarEstadoShare(a, d) {
  const dono = !d.eu, souAtivo = dono ? d.controle === "host" : d.controle === d.eu, antes = a.share && a.share.souAtivo;
  a.share = { ...(a.share || {}), ...d, papel: dono ? "dono" : "convidado", souAtivo, aguardando: false };
  if (antes !== undefined && antes !== souAtivo) toast(souAtivo ? "Você está com o controle (ATIVO)" : "Agora você está observando", souAtivo ? "" : "aviso");
  desenharShare(a);
}
function desenharShare(a) {
  if (a.btn) {
    const p = a.btn.querySelector(".ponto");
    p.classList.toggle("live", !!(a.share && a.share.papel === "dono"));
    p.classList.toggle("remoto", !!(a.share && a.share.papel === "convidado"));
  }
  if (a.id !== ativa) return;
  const bar = $("#share-barra"), s = a.share;
  $("#btn-compartilhar").innerHTML = `📡<span class="rot"> ${s && s.papel === "dono" ? "Ao vivo" : "Compartilhar"}</span>`;
  document.body.classList.toggle("ao-vivo", [...abas.values()].some((x) => x.share && x.share.papel === "dono"));
  if (!s) { bar.classList.add("oculto"); bar.innerHTML = ""; return; }
  bar.classList.remove("oculto"); bar.classList.toggle("convidado", s.papel === "convidado");
  const chips = (s.participantes || []).map((p) => {
    const eu = s.papel === "dono" ? p.id === "host" : p.id === s.eu;
    const acoes = s.papel === "dono" && p.id !== "host"
      ? `${p.ativo ? "" : `<button data-ctrl="${p.id}" title="Passar o controle">⇄</button>`}<button data-rm="${p.id}" title="Remover da sessão">✕</button>` : "";
    return `<span class="pessoa ${p.ativo ? "ativo" : "passivo"}" title="${p.ativo ? "ATIVO: está digitando" : "OBSERVANDO"}">
      <span class="bola"></span>${esc(p.nome)}${eu ? " (você)" : ""} <small>${p.ativo ? "digitando" : "observando"}</small>${acoes}</span>`;
  }).join("");
  if (s.papel === "dono") {
    bar.innerHTML = `<span class="ao-vivo">AO VIVO</span><span class="codigo" id="sh-codigo" title="Clique para copiar">${esc(s.codigo)}</span>
      ${chips || ""}${(s.participantes || []).length <= 1 ? `<small style="color:var(--suave)">passe o código para o colega (🔗 Entrar)</small>` : ""}
      <div class="dir"><button class="btn destaque" id="sh-convidar" title="Mandar o convite com link e código pelo WhatsApp">✉ Convidar</button>
      ${s.souAtivo ? "" : `<button class="btn primario" id="sh-retomar">Retomar controle</button>`}
      <button class="btn" id="sh-encerrar">Encerrar</button></div>`;
  } else {
    bar.innerHTML = `<span class="ao-vivo">SESSÃO REMOTA</span>${s.aguardando ? `<small>aguardando o dono aprovar a entrada…</small>` : chips}
      <div class="dir">${s.aguardando ? "" : s.souAtivo ? `<button class="btn" id="sh-devolver">Devolver controle</button>`
        : `<button class="btn primario" id="sh-pedir">Pedir controle</button>`}<button class="btn" id="sh-sair">Sair</button></div>`;
  }
  const on = (id, fn) => { const el = bar.querySelector(id); if (el) el.onclick = fn; };
  on("#sh-codigo", () => { navigator.clipboard.writeText(s.codigo).catch(() => {}); toast("Código copiado: " + s.codigo); });
  on("#sh-retomar", () => api.share_controle(a.id, "host"));
  on("#sh-convidar", () => abrirConvite(a));
  on("#sh-encerrar", async () => { await api.share_encerrar(a.id); a.share = null; desenharShare(a); toast("Compartilhamento encerrado"); });
  on("#sh-pedir", () => { api.share_pedir(a.id); toast("Pedido de controle enviado ao dono"); });
  on("#sh-devolver", () => api.share_devolver(a.id));
  on("#sh-sair", () => fecharAba(a.id));
  bar.querySelectorAll("[data-ctrl]").forEach((b) => (b.onclick = () => api.share_controle(a.id, b.dataset.ctrl)));
  bar.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => api.share_remover(a.id, b.dataset.rm)));
}
async function compartilhar() {
  const a = A();
  if (!a || !a.conectado) return toast("Conecte a aba antes de compartilhar", "aviso");
  if (a.tipo === "remoto") return toast("Esta aba já é uma sessão remota", "aviso");
  if (a.tipo === "web") return toast("O compartilhamento ao vivo é para abas de terminal", "aviso");
  if (a.share) return toast("Esta aba já está ao vivo — código: " + a.share.codigo);
  if (!(await garantirNome())) return;
  toast("Abrindo sessão ao vivo…");
  const r = await api.share_iniciar(a.id);
  if (!r.ok) return toast(r.erro, "erro");
  a.share = { ...r, papel: "dono", souAtivo: true }; desenharShare(a);
  navigator.clipboard.writeText(r.codigo).catch(() => {});
  toast(`Ao vivo! Código ${r.codigo} copiado — use ✉ Convidar para mandar pelo WhatsApp`);
  return r.codigo;
}
// ---------- convite pelo WhatsApp (contato/grupo escolhido na hora, pode ser outro que não o das evidências) ----------
async function abrirConvite(a = A()) {
  if (!a || !a.conectado) return toast("Conecte a aba antes de convidar", "aviso");
  if (!a.share) { const c = await compartilhar(); if (!c) return; }
  const r = await api.convite_texto(a.id);
  if (!r.ok) return toast(r.erro, "erro");
  $("#cv-codigo").textContent = r.codigo; $("#cv-link").value = r.link || "";
  $("#cv-texto").value = r.texto; $("#cv-para").value = "";
  $("#cv-para").placeholder = r.conversa ? `ex.: ${r.conversa}` : "Nome do contato ou grupo, como aparece no WhatsApp";
  abrirModal("#modal-convite"); setTimeout(() => $("#cv-para").focus(), 50);
  $("#cv-link").oninput = () => {   // troca a linha do link na prévia (função: "$&"/"$1" na URL não viram padrão)
    const l = $("#cv-link").value.trim(), t = $("#cv-texto").value;
    const nova = l ? `1️⃣ Baixe o DASSH Console (Windows):\n${l}` : "1️⃣ Instale o DASSH Console (Windows) — peça o instalador a quem convidou";
    $("#cv-texto").value = t.replace(/1️⃣[^\n]*(\n(?!2️⃣)[^\n]*)?/, () => nova);
  };
  $("#cv-copiar").onclick = () => { navigator.clipboard.writeText($("#cv-texto").value).catch(() => {}); toast("Convite copiado — cole onde quiser"); };
  $("#cv-enviar").onclick = async () => {
    const para = $("#cv-para").value.trim();
    if (!para) { $("#cv-para").focus(); return toast("Escolha o contato ou grupo", "aviso"); }
    const x = await api.convidar(para, $("#cv-texto").value, $("#cv-link").value);
    if (!x.ok) return toast(x.erro, "erro");
    $("#modal-convite").classList.add("oculto");
    toast(`✉ Convite na fila para ${x.conversa} (${x.posicao}º)`);
  };
  // a lista de conversas vem por último (o WhatsApp pode demorar): os botões acima já funcionam
  $("#cv-chips").innerHTML = `<small style="color:var(--suave)">carregando conversas do WhatsApp…</small>`;
  const lista = await api.wa_conversas();
  $("#cv-lista").innerHTML = lista.map((n) => `<option value="${esc(n)}">`).join("");
  $("#cv-chips").innerHTML = lista.slice(0, 8).map((n) => `<button class="wb-jan" data-n="${esc(n)}">${esc(n)}</button>`).join("") ||
    `<small style="color:var(--suave)">Abra o WhatsApp para escolher da lista — ou digite o nome.</small>`;
  $("#cv-chips").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => { $("#cv-para").value = b.dataset.n; }));
}
async function entrarSessao(codigo) {
  if (!(await garantirNome())) return;
  if (!codigo) {
    const v = await pedir("Entrar na sessão de um colega", [{ id: "codigo", label: "Código da sessão", ph: "ABCD-EFGH-JKLM", max: 16 }], "Entrar");
    if (!v || !v.codigo) return; codigo = v.codigo;
  }
  const a = novaAba("remoto"); a.tipo = "remoto";
  a.term.write("\x1bcConectando à sessão " + codigo.toUpperCase() + "…\r\n");
  const r = await api.conectar(a.id, "remoto", null, null, codigo);
  if (!r.ok) { a.term.write(`\x1b[31m${r.erro}\x1b[0m\r\n`); return toast(r.erro, "erro"); }
  a.alvo = r.alvo; setConectado(a, true, r.nome);
  a.share = { papel: "convidado", aguardando: true, souAtivo: false }; desenharShare(a);
  a.term.write("Pedido enviado — aguardando o dono aprovar…\r\n");
  return a;
}

// ================= assistente de rede do equipamento =================
async function abrirRede(tipo, continuar, av) {
  const campo = tipo === "ssh" ? "#ssh-destino" : "#web-url", alvo = $(campo).value.trim();
  abrirModal("#modal-rede");
  const c = $("#rede-corpo");
  if (!av) {
    if (!alvo) return (c.innerHTML = `<div class="rede-st ruim">Informe o endereço do equipamento no topo (ou escolha um padrão de fábrica).</div>` + padroesHtml());
    c.innerHTML = `<div class="rede-st">⏳ Testando ${esc(alvo)}…</div>`;
    av = await api.rede_avaliar(alvo, tipo === "ssh" ? [22] : [443, 80, 8443]);
  }
  if (!av.ok) return (c.innerHTML = `<div class="rede-st ruim">${esc(av.erro)}</div>` + padroesHtml());
  const s = av.sugestao;
  let h = av.alcanca ? `<div class="rede-st ok">✔ ${esc(av.ip)} responde (porta ${av.porta}). Pode conectar.</div>`
    : `<div class="rede-st ruim">✖ ${esc(av.ip)} não respondeu.${av.mesma_rede && !av.conflito ? ` O notebook já está na rede pela placa ${esc(av.mesma_rede.placa)} — confira o cabo e se o equipamento está ligado.` : ""}</div>`;
  if (av.conflito) h += `<div class="rede-conf">⚠ ${esc(av.conflito)} O DASSH Console resolve com uma <b>rota exclusiva</b> para ${esc(av.ip)} pela placa do cabo (Wi-Fi e internet continuam funcionando).</div>`;
  if (s) {
    const opts = (av.placas || []).map((p) => `<option ${p.nome === s.placa ? "selected" : ""} value="${esc(p.nome)}">${esc(p.nome)} — ${p.status === "Up" ? "conectada" : "sem cabo"}</option>`).join("");
    h += `<p style="margin:4px 0">O notebook precisa de um IP na rede <b>${esc(s.rede)}</b>. Sugestão (IP <b>adicional</b> e temporário — não altera sua configuração atual):</p>
      <div class="rede-form"><label>Placa de rede<select id="rd-placa">${opts}</select></label>
        <label>IP do notebook<input id="rd-ip" value="${esc(s.ip)}"></label>
        <label>Máscara<select id="rd-pref"><option value="24" selected>255.255.255.0 (/24)</option><option value="16">255.255.0.0 (/16)</option>
          <option value="25">255.255.255.128 (/25)</option><option value="26">255.255.255.192 (/26)</option></select></label></div>
      ${s.cabo_desconectado ? `<div class="rede-conf" style="border-color:#6b5520;background:#2a2412;color:var(--aviso)">🔌 A placa ${esc(s.placa)} está <b>sem cabo</b>: ligue o cabo de rede do notebook na porta de gerência do equipamento.</div>` : ""}`;
  }
  h += `<div class="rede-acoes">${s ? `<button class="btn primario" id="rd-aplicar">Aplicar IP temporário${continuar ? " e conectar" : ""}</button>` : ""}
    <button class="btn" id="rd-testar">⟳ Testar de novo</button>${continuar ? `<button class="btn" id="rd-seguir">Conectar mesmo assim</button>` : ""}</div>` + padroesHtml();
  const temp = av.temporarios || [];
  if (temp.length) h += `<div class="rede-temp"><b>IPs temporários ativos</b>${temp.map((t) => `<div><span>${esc(t.ip)} na placa ${esc(t.placa)}${t.rota ? ` · rota ${esc(t.rota)}` : ""}</span>
      <button class="btn" data-rmip="${esc(t.ip)}">Remover</button></div>`).join("")}</div>`;
  c.innerHTML = h;
  const on = (sel, fn) => { const e = c.querySelector(sel); if (e) e.onclick = fn; };
  on("#rd-testar", () => abrirRede(tipo, continuar));
  on("#rd-seguir", () => { $("#modal-rede").classList.add("oculto"); continuar(); });
  on("#rd-aplicar", async () => {
    const b = c.querySelector("#rd-aplicar"); b.disabled = true; b.textContent = "Aguardando a permissão do Windows (administrador)…";
    const r = await api.rede_aplicar($("#rd-placa").value, $("#rd-ip").value.trim(), +$("#rd-pref").value, s.rota);
    if (!r.ok) { b.disabled = false; b.textContent = "Aplicar IP temporário"; return toast(r.erro || "Não foi possível configurar", "erro"); }
    toast(`IP ${$("#rd-ip").value} aplicado na placa ${$("#rd-placa").value} — será removido no fim da sessão`);
    b.textContent = "Aguardando o equipamento responder…";
    for (let i = 0; i < 6; i++) {
      const n = await api.rede_avaliar(alvo, tipo === "ssh" ? [22] : [443, 80, 8443]);
      if (n.alcanca) { $("#modal-rede").classList.add("oculto"); toast(`${n.ip} respondeu`); return continuar && continuar(); }
      await new Promise((ok) => setTimeout(ok, 1500));
    }
    abrirRede(tipo, continuar);
    toast("IP aplicado, mas o equipamento ainda não respondeu — confira o cabo e se ele está ligado", "aviso");
  });
  c.querySelectorAll("[data-rmip]").forEach((b) => (b.onclick = async () => {
    const r = await api.rede_remover(b.dataset.rmip); toast(r.ok ? "IP temporário removido" : r.erro, r.ok ? "" : "erro"); abrirRede(tipo, continuar);
  }));
  const sel = c.querySelector("#rd-padrao");
  if (sel) sel.onchange = () => {
    if (!sel.value) return;
    $(campo).value = tipo === "ssh" ? `admin@${sel.value}` : `https://${sel.value}`;
    abrirRede(tipo, continuar);
  };
}
function padroesHtml() {
  const P = [["Dell iDRAC", "192.168.0.120"], ["Huawei iBMC", "192.168.2.100"], ["Lenovo XClarity (XCC)", "192.168.70.125"],
             ["Switch Huawei — gerência MEth", "192.168.1.253"], ["FortiGate — gerência", "192.168.1.99"]];
  return `<div class="rede-temp"><label style="display:flex;gap:8px;align-items:center;color:var(--suave)">Padrões de fábrica:
    <select id="rd-padrao"><option value="">— escolher —</option>${P.map(([n, ip]) => `<option value="${ip}">${n} (${ip})</option>`).join("")}</select></label></div>`;
}
async function oferecerRemoverRede() {
  const t = await api.rede_temporarios(); if (!t.length) return;
  pedido(`🛜 O IP temporário <b>${esc(t.map((x) => x.ip).join(", "))}</b> ainda está configurado na placa de rede. Remover agora?`,
    "Remover", "Manter", async (ok) => { if (ok) { const r = await api.rede_remover(); toast(r.ok ? "IP temporário removido" : r.erro, r.ok ? "" : "erro"); } });
}

// ================= diagnóstico do cabo console =================
async function diagnosticarCabo() {
  abrirModal("#modal-cabo");
  const c = $("#cabo-corpo");
  c.innerHTML = `<div class="cabo-vazio"><span class="giro" style="display:inline-block;width:14px;height:14px;border:2px solid var(--verde);border-right-color:transparent;border-radius:50%;animation:giro .8s linear infinite"></span>
    <br><br>Procurando cabos console e testando as portas…</div>`;
  const r = await api.cabo_diagnostico();
  if (!r.ok) { c.innerHTML = `<div class="cabo-vazio">${esc(r.erro)}</div>`; return; }
  if (!r.adaptadores.length) {
    c.innerHTML = `<div class="cabo-vazio"><b>Nenhum cabo console USB conectado.</b><br><br>Conecte o cabo na porta USB e clique em
      <b>⟳ Testar de novo</b>.<br><small>Reconhecidos: WCH CH340/CH341, FTDI, Prolific PL2303, Silicon Labs CP210x.</small></div>`;
    return;
  }
  c.innerHTML = "";
  r.adaptadores.forEach((a) => {
    const t = a.teste || {}, cls = t.ok ? "ok" : (a.acoes.some((x) => x.id === "driver_ch340") || !a.porta) ? "ruim" : "aviso";
    const d = document.createElement("div"); d.className = "cabo " + cls;
    d.innerHTML = `<h4>🔌 ${esc(a.chip)} <small>${esc(a.porta || "sem porta COM")} · driver ${esc(a.versao || "—")} ${esc(a.fornecedor || "")}</small></h4>
      <div class="ver">${t.ok ? "✔" : "✖"} ${esc(a.veredito)}</div>
      ${a.aviso ? `<div class="det">⚠ ${esc(a.aviso)}</div>` : ""}
      <div class="linha-btn"></div>`;
    const lb = d.querySelector(".linha-btn");
    a.acoes.forEach((x) => {
      const b = document.createElement("button"); b.className = "btn" + (x.id === "driver_ch340" ? " primario" : ""); b.textContent = x.rotulo;
      b.onclick = async () => {
        if (x.id === "link") return api.abrir_link(x.url);
        if (x.id === "reconectar") return toast("Desconecte o cabo, espere 3 segundos, reconecte e clique em ⟳ Testar de novo");
        b.disabled = true; b.textContent = "Aguardando a permissão do Windows (administrador)…";
        const res = await api.cabo_corrigir(x.id, a.hwid);
        if (!res.ok) { b.disabled = false; b.textContent = x.rotulo; return toast(res.erro || "Não foi possível corrigir", "erro"); }
        toast(x.id === "driver_ch340" ? "Driver instalado — testando de novo…" : "Pronto: o Windows não vai mais trocar o driver sozinho");
        if (res.reiniciar) toast("O Windows pediu para reiniciar o computador para concluir", "aviso");
        diagnosticarCabo(); carregarPortas();
      };
      lb.appendChild(b);
    });
    c.appendChild(d);
  });
}

// ================= roteiros de coleta =================
const RE_MORE = /(-{2,}\s*More\s*-{2,}|--\s*More\s*--|<---\s*More\s*--->|Press any key to continue|\(more\))/i;
const RE_PROMPT = /([<\[][^\s<>\[\]]+[>\]]|[\w\-.()]+[#>$]|PS [A-Z]:\\[^>]*>|[A-Z]:\\[^>]*>|\$|#)\s*$/;
// segurança: roteiro "somente leitura" só aceita comandos de consulta
const RE_LEITURA = /^\s*(display|dis |show |dir |get |get-|ping |tracert |traceroute |ipconfig|systeminfo|hostname|hostnamectl|uname|uptime|df |free|ip -br|ip a|ss -|systemctl --failed|systemctl status|cat \/proc)/i;
let ROTEIROS = [], rotSel = null;

// Espera o comando TERMINAR: saída parada + cursor num prompt ou num "---- More ----".
// Sem prompt reconhecível (equipamento diferente), aceita após 8 s parado. Limite geral: max.
function esperarSaida(a, desde, quieto = 900, max = 120000) {
  return new Promise((res) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const ult = a.ultimaEscrita || 0, parado = Date.now() - Math.max(ult, desde);
      const ln = linhaCursor(a.term), fim = RE_MORE.test(ln) || RE_PROMPT.test(ln);
      if ((ult > desde && parado >= quieto && fim) || parado >= 8000 || Date.now() - t0 > max || !a.conectado || (a.roteiro && a.roteiro.parar)) {
        clearInterval(iv); res();
      }
    }, 150);
  });
}
const SHELL_WIN = ["powershell", "cmd", "azure", "gcp"];
function desenharRoteiro(a) {
  if (a.id !== ativa) return;
  const bar = $("#roteiro-barra"), r = a.roteiro;
  if (!r) { bar.classList.add("oculto"); return; }
  bar.classList.remove("oculto");
  bar.innerHTML = `<b>▶ ${esc(r.nome)}</b><span>${r.i}/${r.total}</span><code>${esc(r.atual || "")}</code>
    <span class="prog"><i style="width:${Math.round((r.i / r.total) * 100)}%"></i></span>
    <span>${r.evid} evidência(s)</span><button class="btn" id="rot-parar">${r.parar ? "Parando…" : "■ Parar"}</button>`;
  bar.querySelector("#rot-parar").onclick = () => { r.parar = true; desenharRoteiro(a); };
}
// Saída maior que a tela e sem paginação (PowerShell, Linux): captura tela por tela rolando o terminal.
async function capturarRolando(a, ini, c, nomeRot, enviar) {
  const b = a.term.buffer.active, R = a.term.rows, fim = b.baseY + b.cursorY, total = fim - ini + 1;
  if (total <= R || ini < 0) { await evidencia(enviar, nomeRot, a, c.cmd); a.roteiro.evid++; desenharRoteiro(a); return; }
  const n = Math.min(Math.ceil(total / R), c.paginas || 8);
  for (let k = 0; k < n && !a.roteiro.parar; k++) {
    a.term.scrollToLine(Math.min(ini + k * R, b.baseY));
    await new Promise((r) => setTimeout(r, 120));
    await evidencia(enviar, nomeRot, a, c.cmd); a.roteiro.evid++; desenharRoteiro(a);
  }
  a.term.scrollToBottom();
}
async function executarRoteiro(rot, enviar) {
  const a = A();
  if (!a || !a.conectado) return toast("Conecte a aba e faça o login no equipamento antes de rodar o roteiro", "aviso");
  if (a.share && !a.share.souAtivo) return toast("Você está observando: peça o controle para rodar um roteiro", "aviso");
  if (a.roteiro) return toast("Já há um roteiro rodando nesta aba", "aviso");
  if (a.tipo === "web") return toast("Roteiros são para abas de terminal (Serial, SSH, PowerShell…)", "aviso");
  const proibidos = rot.somente_leitura ? rot.comandos.filter((c) => !RE_LEITURA.test(c.cmd)) : [];
  if (proibidos.length) return toast(`Roteiro bloqueado: "${proibidos[0].cmd}" não é comando de consulta`, "erro");
  if (!rot.somente_leitura && !(await confirmar(`⚠ <b>${esc(rot.nome)}</b> GRAVA arquivos (ex.: cópia para o pendrive). Não altera a configuração do equipamento. Executar?`))) return;
  const passos = [...rot.comandos];
  a.roteiro = { nome: rot.nome, i: 0, total: passos.length, evid: 0, parar: false };
  for (let k = 0; k < passos.length; k++) {
    let c = passos[k];
    if (a.roteiro.parar || !a.conectado) break;
    if (c.copiar_pasta) {   // lista a pasta, lê os nomes dos arquivos e vira um "copy" (com confirmação) para cada um
      a.term.clear(); let desde = Date.now(); api.escrever(a.id, `dir ${c.copiar_pasta}\r`); await esperarSaida(a, desde, 1500, 30000);
      const nomes = arquivosDoDir(a.term);
      const pasta = c.copiar_pasta.includes("*") ? c.copiar_pasta.replace(/[^/]*$/, "") : c.copiar_pasta.replace(/\/?$/, "/");   // curinga: copia da pasta-mãe
      passos.splice(k + 1, 0, ...nomes.map((n) => ({ cmd: `copy ${pasta}${n} ${c.destino}`, confirmar: true, paginas: 2 })));
      a.roteiro.total = passos.length; toast(`📂 ${c.copiar_pasta}: ${nomes.length} arquivo(s) para copiar`);
      c = { cmd: `dir ${c.copiar_pasta}`, paginas: 6 };   // a listagem também vira evidência
      a.term.clear();
    }
    a.roteiro.i++; a.roteiro.atual = c.cmd; desenharRoteiro(a);
    const env = enviar && (!rot.whatsapp || rot.whatsapp.includes(c.cmd));   // só as evidências-chave vão para o WhatsApp
    let desde = Date.now();
    if (SHELL_WIN.includes(a.tipo)) {        // shells do Windows: limpar no próprio shell (o ConPTY redesenha a tela)
      api.escrever(a.id, "cls\r"); await esperarSaida(a, desde, 600, 10000);
    } else a.term.clear();
    const buf0 = a.term.buffer.active, ini = buf0.baseY + buf0.cursorY;   // linha onde o comando começa
    desde = Date.now(); api.escrever(a.id, c.cmd + "\r");
    await esperarSaida(a, desde);
    for (let n = 0; c.confirmar && n < 3 && /\[\s*Y\s*\/\s*N\s*\]\s*:?\s*$/i.test(linhaCursor(a.term)); n++) {   // "Copy ...? [Y/N]:"
      desde = Date.now(); api.escrever(a.id, "y\r"); await esperarSaida(a, desde, 1500, 120000);
    }
    for (let pag = 1; ; pag++) {
      if (a.roteiro.parar) break;
      const ln = linhaCursor(a.term);
      if (!RE_MORE.test(ln)) {                            // comando terminou (prompt)
        await capturarRolando(a, ini, c, rot.nome, env); break;
      }
      // até o limite: evidência de cada página; depois do limite NÃO corta a saída (o fabricante quer tudo):
      // continua paginando até o fim e o conteúdo integral fica no log da sessão (anexado ao PDF)
      if (pag <= (c.paginas || 8)) { await evidencia(env, rot.nome, a, c.cmd); a.roteiro.evid++; desenharRoteiro(a); }
      else if (pag > 2000) { desde = Date.now(); api.escrever(a.id, "\x03"); await esperarSaida(a, desde, 800, 5000); break; }
      a.term.clear(); desde = Date.now(); api.escrever(a.id, " ");   // próxima página
      await esperarSaida(a, desde);
    }
  }
  const r = a.roteiro; a.roteiro = null; desenharRoteiro(a);
  toast(`${r.parar ? "Roteiro interrompido" : "Roteiro concluído"}: ${r.evid} evidência(s) — gere o 📄 Relatório quando quiser`);
}
// nomes de arquivo na saída do "dir" (Huawei: "  0  -rw-  12,345  Oct 06 2026 10:00:01   log.log.zip")
function arquivosDoDir(term) {
  const b = term.buffer.active, nomes = [];
  for (let y = 0; y <= b.baseY + b.cursorY; y++) {
    const t = (b.getLine(y) && b.getLine(y).translateToString(true)) || "";
    const m = t.match(/^\s*\d+\s+-[rwx-]{3,}\s+[\d,]+\s+.+?\s+(\S+)\s*$/);
    if (m) nomes.push(m[1]);
  }
  return nomes;
}
const confirmar = (html) => new Promise((ok) => pedido(html, "Executar", "Cancelar", ok, "confirmar-roteiro"));
async function abrirRoteiros() {
  ROTEIROS = await api.roteiros();
  const fab = [...new Set(ROTEIROS.map((r) => r.fabricante).filter(Boolean))].sort(), f = $("#rot-filtro");
  f.innerHTML = `<option value="">Todos os fabricantes</option>` + fab.map((x) => `<option>${esc(x)}</option>`).join("");
  $("#rot-busca").value = ""; $("#rot-busca").oninput = desenharRoteiros; f.onchange = desenharRoteiros;
  desenharRoteiros(); abrirModal("#modal-roteiro"); setTimeout(() => $("#rot-busca").focus(), 50);
}
function desenharRoteiros() {
  const ul = $("#rot-lista"); ul.innerHTML = "";
  const a = A(), tipo = a && a.tipo, q = $("#rot-busca").value.trim().toLowerCase(), fab = $("#rot-filtro").value;
  const lista = ROTEIROS.filter((r) => (!fab || r.fabricante === fab) &&
    (!q || [r.nome, r.fabricante, r.descricao, ...r.comandos.map((c) => c.cmd)].join(" ").toLowerCase().includes(q)));
  if (!lista.length) ul.innerHTML = `<li style="cursor:default;color:var(--suave)">Nenhuma automação encontrada.</li>`;
  lista.sort((x, y) => (x.tipo === tipo ? 0 : 1) - (y.tipo === tipo ? 0 : 1) || x.nome.localeCompare(y.nome)).forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${esc(r.nome)}<small>${esc(r.fabricante || "")} · ${r.comandos.length} comandos${r.tipo === tipo ? '<span class="tag">combina com esta aba</span>' : ""}</small>`;
    li.onclick = () => {
      rotSel = r; ul.querySelectorAll("li").forEach((x) => x.classList.remove("sel")); li.classList.add("sel");
      $("#rot-tit").textContent = r.nome; $("#rot-desc").textContent = (r.descricao || "") + (r.somente_leitura ? " · somente leitura" : "");
      $("#rot-cmds").innerHTML = r.comandos.map((c) => `<li>${esc(c.cmd)} ${c.paginas && c.paginas !== 8 ? `<small>(até ${c.paginas} pág.)</small>` : ""}</li>`).join("");
      $("#rot-executar").disabled = false;
    };
    ul.appendChild(li); if (i === 0) li.click();
  });
}

// ================= relatório =================
async function gerarRelatorio() {
  toast("Gerando o relatório do atendimento (PDF)…");
  $("#btn-relatorio").disabled = true;
  try {
    const r = await api.relatorio_gerar();
    if (!r.ok) return toast(r.erro, "erro");
    const nome = r.pdf.split("\\").pop();
    pedido(`📄 <b>Relatório gerado</b> — ${r.evidencias} evidência(s), ${r.logs} log(s), ${r.gravacoes} gravação(ões).<br>
      <small>${esc(nome)} · ${esc(r.id)}</small>`, "Ver e assinar", "Enviar no WhatsApp", (abrir) => {
      if (abrir) abrirPdf(r.pdf);
      else api.wa_enviar_arquivo(r.pdf, `Relatório de atendimento ${r.id}`).then((x) =>
        x.ok ? toast(`Relatório na fila de envio para ${x.conversa} (${x.posicao}º)`) : toast(x.erro, "erro"));
    });
  } finally { $("#btn-relatorio").disabled = false; }
}

// ---------- equipamentos salvos ----------
let EQ = [], eqEdit = null, eqPag = 0;
const EQ_POR_PAG = 20;
const TIPO_NOME = { serial: "Serial", ssh: "SSH", web: "Web", powershell: "PowerShell", cmd: "CMD" };
async function abrirEquip() {
  EQ = await api.equip_listar(); desenharEquip(); abrirModal("#modal-equip"); setTimeout(() => $("#eq-busca").focus(), 50);
}
function desenharEquip() {
  const q = $("#eq-busca").value.trim().toLowerCase(), t = $("#eq-tipo").value, o = $("#eq-ordem").value;
  let l = EQ.filter((e) => (!t || e.tipo === t) && (!q || `${e.nome} ${e.destino} ${e.grupo} ${e.obs}`.toLowerCase().includes(q)));
  l.sort((a, b) => o === "ultima" ? (b.ultima || "").localeCompare(a.ultima || "")
    : o === "grupo" ? (a.grupo || "~").localeCompare(b.grupo || "~") || a.nome.localeCompare(b.nome) : a.nome.localeCompare(b.nome));
  const [ini, fim, p] = paginador($("#eq-pag"), l.length, eqPag, (n) => { eqPag = n; desenharEquip(); }, "equipamento(s)");
  eqPag = p; l = l.slice(ini, fim);
  $("#eq-linhas").innerHTML = l.length ? l.map((e) => `<tr data-id="${e.id}"><td><b>${esc(e.nome)}</b>${e.obs ? `<br><small>${esc(e.obs)}</small>` : ""}</td>
      <td><span class="eq-tipo t-${e.tipo}">${TIPO_NOME[e.tipo] || e.tipo}</span></td><td class="mono">${esc(e.destino)}</td>
      <td>${esc(e.grupo || "")}</td><td><small>${esc(e.ultima || "—")}</small></td>
      <td class="eq-acoes"><button class="btn mini primario" data-c>▶ Conectar</button><button class="btn mini" data-e title="Editar">✎</button>
      <button class="btn mini" data-r title="Remover">🗑</button></td></tr>`).join("")
    : `<tr><td colspan="6" class="vazio">${EQ.length ? "Nada encontrado com esse filtro." : "Nenhum equipamento salvo ainda — conecte e use “＋ Salvar a aba atual”, ou ⬇ Importar."}</td></tr>`;
  $("#eq-linhas").querySelectorAll("tr[data-id]").forEach((tr) => {
    const e = EQ.find((x) => x.id === tr.dataset.id);
    tr.ondblclick = () => conectarEquip(e);
    tr.querySelector("[data-c]").onclick = () => conectarEquip(e);
    tr.querySelector("[data-e]").onclick = () => formEquip(e);
    tr.querySelector("[data-r]").onclick = async () => { await api.equip_remover(e.id); EQ = await api.equip_listar(); desenharEquip(); toast(`Removido: ${e.nome}`); };
  });
}
function formEquip(e) {
  eqEdit = e || {}; $("#eq-form").classList.remove("oculto");
  $("#eq-f-nome").value = eqEdit.nome || ""; $("#eq-f-tipo").value = eqEdit.tipo || "ssh"; $("#eq-f-destino").value = eqEdit.destino || "";
  $("#eq-f-grupo").value = eqEdit.grupo || ""; $("#eq-f-obs").value = eqEdit.obs || ""; $("#eq-f-nome").focus();
}
async function conectarEquip(e) {
  $("#modal-equip").classList.add("oculto");
  let a = A(); if (a.conectado) a = novaAba(e.tipo);
  a.tipo = e.tipo; selecionarTipo(e.tipo);
  if (e.tipo === "serial") {
    const [porta, baud] = e.destino.split(":"); await carregarPortas();
    if (![...$("#porta").options].some((o) => o.value === porta)) return toast(`${porta} não está conectada neste computador`, "aviso");
    $("#porta").value = porta; if (baud) $("#baud").value = baud;
  } else if (e.tipo === "ssh") $("#ssh-destino").value = e.destino;
  else if (e.tipo === "web") $("#web-url").value = e.destino;
  api.equip_usado(e.id); toast(`Conectando: ${e.nome}`);
  await conectar(a);
}
function iniciarEquip() {
  $("#btn-equip").onclick = abrirEquip;
  ["#eq-busca", "#eq-tipo", "#eq-ordem"].forEach((s) => $(s).addEventListener("input", () => { eqPag = 0; desenharEquip(); }));
  $("#eq-novo").onclick = () => formEquip(null);
  $("#eq-f-cancelar").onclick = () => $("#eq-form").classList.add("oculto");
  $("#eq-f-ok").onclick = async () => {
    const it = { ...eqEdit, nome: $("#eq-f-nome").value, tipo: $("#eq-f-tipo").value, destino: $("#eq-f-destino").value.trim(),
                 grupo: $("#eq-f-grupo").value, obs: $("#eq-f-obs").value };
    if (!it.destino) return toast("Informe o destino (IP, usuario@ip, URL ou COM)", "aviso");
    await api.equip_salvar(it); $("#eq-form").classList.add("oculto"); EQ = await api.equip_listar(); desenharEquip();
  };
  $("#eq-salvar-aba").onclick = () => {
    const a = A(), p = a.params || {};
    const destino = a.tipo === "serial" ? (p.porta ? `${p.porta}:${p.baud || 9600}` : "") : p.destino || "";
    if (!destino) return toast("Conecte a aba primeiro (Serial, SSH ou Web) para salvar", "aviso");
    formEquip({ tipo: a.tipo, destino, nome: a.equip ? `${a.equip}` : a.nome.replace(/^(SSH|Web|Serial)\s*/, "") });
  };
  $("#eq-importar").onclick = () => pedido("⬇ <b>Importar equipamentos</b><br><small>Planilha CSV / backup JSON, ou as sessões salvas no PuTTY deste computador.</small>",
    "Arquivo CSV/JSON", "Sessões do PuTTY", async (arq) => {
      const r = await api.equip_importar(arq ? "arquivo" : "putty");
      if (r.cancelado) return; if (!r.ok) return toast(r.erro, "erro");
      toast(`Importado: ${r.novos} novo(s), ${r.atualizados} atualizado(s) — total ${r.total}`);
      EQ = await api.equip_listar(); desenharEquip();
    });
  $("#eq-exportar").onclick = async () => {
    const r = await api.equip_exportar(); if (r.cancelado) return;
    toast(r.ok ? `Exportado: ${r.total} equipamento(s) → ${r.caminho.split("\\").pop()}` : r.erro, r.ok ? "" : "erro");
  };
}

// ---------- PDF dentro do app: ver, assinar e datar ----------
let PDF = null;
async function abrirPdf(caminho) {
  const r = await api.pdf_ler(caminho || "");
  if (!r.ok) return toast(r.erro, "erro");
  PDF = r;
  const bin = atob(r.b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  if (abrirPdf.url) URL.revokeObjectURL(abrirPdf.url);
  abrirPdf.url = URL.createObjectURL(new Blob([u8], { type: "application/pdf" }));
  $("#pdf-ver").src = abrirPdf.url + "#view=FitH";
  $("#pdf-tit").textContent = "📄 " + r.nome;
  const livre = r.quadros.find((q) => !q.assinado);
  $("#pdf-quadros").innerHTML = r.quadros.map((q) => `<div class="pdf-q ${q.assinado ? "ok" : ""}">
      ${q.assinado ? "✅" : "⬜"} <b>${esc(q.rotulo)}</b><br><small>${q.assinado ? `assinado por ${esc(q.assinado.nome)} · ${esc(q.assinado.quando)}` : "aguardando assinatura"}</small></div>`).join("");
  if (livre) $("#pdf-papel").value = livre.papel;
  $("#pdf-assinar").disabled = !livre;
  preencherNomePdf();
  rubricaLimpar();
  clearInterval(abrirPdf.rel); const rel = () => ($("#pdf-agora").textContent = new Date().toLocaleString("pt-BR"));
  rel(); abrirPdf.rel = setInterval(rel, 1000);
  abrirModal("#modal-pdf");
}
function preencherNomePdf() {
  if (!PDF) return;
  $("#pdf-nome").value = $("#pdf-papel").value === "tecnico" ? PDF.nome_tecnico || "" : PDF.responsavel || "";
}
function rubricaLimpar() { const c = $("#pdf-rub"); c.getContext("2d").clearRect(0, 0, c.width, c.height); c.dataset.usada = ""; }
function iniciarRubrica() {
  const c = $("#pdf-rub"), g = c.getContext("2d");
  let des = false;
  const pt = (e) => { const b = c.getBoundingClientRect(); return [(e.clientX - b.left) * c.width / b.width, (e.clientY - b.top) * c.height / b.height]; };
  c.addEventListener("pointerdown", (e) => { des = true; c.setPointerCapture(e.pointerId); g.beginPath(); g.moveTo(...pt(e)); });
  c.addEventListener("pointermove", (e) => {
    if (!des) return; g.lineWidth = 4; g.lineCap = g.lineJoin = "round"; g.strokeStyle = "#1a2f8a"; g.lineTo(...pt(e)); g.stroke();
    c.dataset.usada = "1";
  });
  ["pointerup", "pointercancel"].forEach((ev) => c.addEventListener(ev, () => (des = false)));
  $("#pdf-rub-limpar").onclick = rubricaLimpar;
  $("#pdf-papel").onchange = preencherNomePdf;
  $("#pdf-fora").onclick = () => PDF && api.abrir_arquivo(PDF.caminho);
  $("#pdf-pasta").onclick = () => PDF && api.abrir_arquivo(PDF.caminho.replace(/\\[^\\]+$/, ""));
  $("#pdf-wa").onclick = () => PDF && api.wa_enviar_arquivo(PDF.caminho, `Relatório de atendimento — ${PDF.nome}`).then((x) =>
    x.ok ? toast(`Relatório na fila de envio para ${x.conversa} (${x.posicao}º)`) : toast(x.erro, "erro"));
  $("#pdf-assinar").onclick = async () => {
    const nome = $("#pdf-nome").value.trim();
    if (!nome) { $("#pdf-nome").focus(); return toast("Informe o nome de quem assina", "aviso"); }
    $("#pdf-assinar").disabled = true; toast("Assinando…");
    const r = await api.pdf_assinar(PDF.caminho, $("#pdf-papel").value, nome, c.dataset.usada ? c.toDataURL("image/png") : null,
                                    $("#pdf-local").value.trim());
    if (!r.ok) { $("#pdf-assinar").disabled = false; return toast(r.erro, "erro"); }
    toast(`✅ ${r.rotulo}: assinado e datado — ${r.pdf.split("\\").pop()}`);
    abrirPdf(r.pdf);
  };
}

// ================= player de gravação =================
let PL = null;
async function tocarGravacao(caminho, titulo) {
  const g = await api.ler_gravacao(caminho);
  if (!g.ok) return toast(g.erro, "erro");
  if (PL) { clearTimeout(PL.tm); PL.term.dispose(); }
  $("#pl-term").innerHTML = "";
  // fonte calculada para o terminal 100x30 caber inteiro na janela (sem barra de rolagem)
  const alt = innerHeight * 0.94 - 130, larg = Math.min(innerWidth * 0.96, 1040) - 40;
  const fs = Math.max(9, Math.min(14, Math.floor(Math.min(alt / (30 * 1.2), larg / (100 * 0.62)))));
  const term = new Terminal({ cols: 100, rows: 30, fontFamily: TEMAS[temaAtual].fonte + ", monospace", fontSize: fs, theme: TEMA, disableStdin: true });
  term.open($("#pl-term"));
  // "Pular pausas": cada silêncio vira no máx. 2 s (uma sessão de 3 min parada não obriga a assistir 3 min)
  const limite = +$("#pl-pausa").value || Infinity, real = g.eventos.length ? g.eventos[g.eventos.length - 1][0] : 0;
  let t = 0, ant = 0; const ev = g.eventos.map((e) => { t += Math.min(limite, Math.max(0, e[0] - ant)); ant = e[0]; return [t, e[2]]; });
  PL = { term, ev, i: 0, pos: 0, total: ev.length ? ev[ev.length - 1][0] : 0, tocando: true, tm: null };
  const mm = (s) => `${Math.floor(s / 60)}min ${pad2(Math.floor(s % 60))}s`;
  $("#pl-tit").textContent = `▶ ${titulo || g.titulo} — duração real ${mm(real)}${limite !== Infinity && real - PL.total > 5 ? ` (pausas encurtadas: assiste em ${mm(PL.total)})` : ""}`;
  $("#pl-pausa").onchange = () => tocarGravacao(caminho, titulo);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const atual = () => { $("#pl-pos").value = PL.total ? Math.round((PL.pos / PL.total) * 1000) : 0; $("#pl-tempo").textContent = `${mmss(PL.pos)} / ${mmss(PL.total)}`; };
  const passo = () => {
    if (!PL.tocando) return;
    if (PL.i >= PL.ev.length) { PL.tocando = false; $("#pl-play").textContent = "▶"; return; }
    const [tt, d] = PL.ev[PL.i++]; PL.term.write(d); PL.pos = tt; atual();
    const prox = PL.i < PL.ev.length ? (PL.ev[PL.i][0] - tt) * 1000 / +$("#pl-vel").value : 0;
    PL.tm = setTimeout(passo, Math.max(0, prox));
  };
  $("#pl-play").textContent = "⏸";
  $("#pl-play").onclick = () => { PL.tocando = !PL.tocando; $("#pl-play").textContent = PL.tocando ? "⏸" : "▶"; if (PL.tocando) { if (PL.i >= PL.ev.length) { PL.i = 0; PL.term.reset(); } passo(); } };
  $("#pl-pos").oninput = (e) => {   // pular para um ponto: redesenha tudo até lá
    clearTimeout(PL.tm); const alvo = (e.target.value / 1000) * PL.total;
    PL.term.reset(); let i = 0; while (i < PL.ev.length && PL.ev[i][0] <= alvo) PL.term.write(PL.ev[i++][1]);
    PL.i = i; PL.pos = alvo; atual(); if (PL.tocando) passo();
  };
  document.querySelector("#modal-player [data-fecha]").onclick = (e) => { PL.tocando = false; clearTimeout(PL.tm); fecharModal(e.target); };
  abrirModal("#modal-player"); passo();
}

// ================= informações (botões i) =================
const INFO = {
  whatsapp: ["Como conectar o WhatsApp", `
    <ol><li>Clique em <b>Abrir WhatsApp</b> — abre uma janela do navegador só do app (Chrome ou Edge).</li>
    <li><b>1ª vez:</b> no celular, WhatsApp → <b>Aparelhos conectados</b> → <b>Conectar aparelho</b> e leia o QR code.
      Nas próximas vezes o app <b>abre sozinho, minimizado e logado</b> ao iniciar.</li>
    <li>Nessa janela, <b>clique na conversa ou grupo</b> que vai receber as evidências.</li>
    <li>Volte aqui e clique em <b>Conectar conversa</b> — o nome aparece com a bolinha verde.</li>
    <li>Pronto: <b>Enviar evidência</b> (<kbd>Ctrl+Alt+E</kbd>) salva, copia e envia a foto com a legenda.</li></ol>
    <p class="nota">Deixe a janela do WhatsApp aberta (pode minimizar). Antes de anexar e antes de enviar o app confere
    o nome da conversa — se não bater, cancela. Não afeta o WhatsApp do seu Chrome/celular (é só mais um aparelho conectado).</p>
    <p class="nota"><b>Por que não usa o WhatsApp que já está aberto no meu Chrome?</b> O login do WhatsApp Web fica preso ao perfil
    do navegador e não pode ser copiado nem controlado com o Chrome aberto. Por isso o app tem o próprio “aparelho conectado”:
    você lê o QR code <b>uma única vez</b> e pronto.</p>`],
  evidencia: ["Evidências", `
    <ul><li><b>Limpar</b> <kbd>Ctrl+Alt+L</kbd>: limpa a tela mantendo o prompt — o print mostra só o próximo comando.</li>
    <li><b>Salvar</b> <kbd>Ctrl+Alt+P</kbd>: gera o print padronizado, salva na pasta do dia e copia (Ctrl+V onde quiser).</li>
    <li><b>Enviar evidência</b> <kbd>Ctrl+Alt+E</kbd>: faz o mesmo que Salvar <b>e</b> envia para a conversa conectada.</li></ul>
    <p>Saída longa com <b>---- More ----</b>: capture, aperte ESPAÇO e capture de novo (vira “parte 2”, “parte 3”…).
    Rolar o terminal para cima e capturar pega a tela que está visível.</p>
    <p><b>Padrão de auditoria</b> (ISO/IEC 27037, ISO 27001 A.5.28, ITIL): cada evidência leva <b>ID único</b>
    (ex.: BB-20261111-12), data/hora <b>com fuso</b>, <b>chamado/mudança</b>, <b>técnico</b>, <b>origem</b> da conexão e
    <b>equipamento</b> (modelo e nº de série reconhecidos <b>sozinhos</b> na tela — ex.: display version / esn, show version,
    Service Tag do iDRAC) e o <b>SHA-256 completo</b>. Tudo também vai para o <b>manifesto de custódia</b> (Evidencias\\manifesto.jsonl).</p>
    <p><b>🧹 auto</b>: limpa a tela depois de cada evidência (pronta para o próximo comando). <b>⏱ manter ativa</b>: evita que a
    sessão caia por inatividade (SSH, serial e páginas web) — sem executar nenhum comando.</p>
    <p><b>⚡ Automações</b>: coleta automática por fabricante. <b>📄 Relatório</b>: PDF do atendimento com capa, resumo,
    evidências, logs, hashes e aceite — abre <b>dentro do app</b> para ver e <b>✍ assinar e datar</b>.</p>
    <p class="nota">Vale sempre para a <b>aba ativa</b>. Informe o nº do chamado em <b>✎</b> no cartão Atendimento.</p>`],
  atendimento: ["Cliente e pasta do atendimento", `
    <p>Tudo é criado pelo app — não precisa criar pasta à mão:</p>
    <ul><li><b>Cliente</b>: escolha na lista. Cliente novo? <b>＋</b> → sigla e nome → cria <b>[SIGLA] Nome</b> na pasta raiz.</li>
    <li><b>Visita do dia</b>: criada sozinha no 1º print/conexão do dia (<b>AAAA-MM-DD - Atendimento</b>, com <b>Evidencias</b> e <b>Logs</b>).
      Clique em <b>✎ dar nome à visita</b> para virar, por ex., <b>2026-11-20 - Troca SW agência Centro</b>.</li>
    <li>A data é conferida <b>na hora de cada print</b>: virou o dia, vai para a pasta do novo dia.</li>
    <li>Numeração: continua do maior número da visita (apagou a última? o número é reaproveitado).</li></ul>
    <p class="nota">⚙ = pasta raiz dos atendimentos (configurada uma vez; hoje: “03 - Atendimentos”).</p>`],
  roteiro: ["Automações de coleta", `
    <ul><li>Pesquise ou filtre por fabricante, escolha a automação (Huawei, Cisco, HPE, Fortinet, Windows, Linux) e clique em <b>Executar</b>.</li>
    <li>O app digita cada comando na aba ativa, espera a saída, <b>tira a evidência de cada tela</b> e avança o
      <b>---- More ----</b> sozinho (com limite de páginas por comando).</li>
    <li>Barra de progresso no terminal, com <b>■ Parar</b> a qualquer momento.</li>
    <li>Roteiros <b>somente leitura</b>: só aceitam comandos de consulta (display, show, get…). Nada de configuração.</li></ul>
    <p class="nota">Faça o login no equipamento antes. Automações próprias: arquivos .json na pasta <b>roteiros</b> do app.</p>`],
  ultimas: ["Últimas evidências", `<p>Evidências desta execução do app: número, comando e se foi <b>salva</b>, <b>enviada</b> ou
    <b>não enviada</b>. Passe o mouse para ver a aba e o arquivo.</p><p class="nota">Sessões anteriores: botão <b>🕘 Histórico</b>.</p>`],
  abas: ["Abas e conexões", `
    <ul><li><b>＋</b> ou <kbd>Ctrl+Alt+T</kbd>: nova aba. Escolha o tipo no topo (Serial, PowerShell, CMD, SSH) e <b>Conectar</b>.</li>
    <li><kbd>Ctrl+Alt+1…8</kbd>: troca de aba. Aba amarela = está pedindo login em segundo plano.</li>
    <li><b>Serial</b>: porta COM do cabo console + velocidade (Huawei = 9600). <b>SSH</b>: <b>usuario@ip</b>.</li>
    <li><b>Azure</b> / <b>GCP</b>: abre o terminal da nuvem já logado — se o CLI não estiver instalado, o app instala sozinho.</li>
    <li><b>🌐 Web</b>: iDRAC, iLO, iBMC, firewalls — o navegador e o <b>console virtual</b> (HTML5 ou Java) abrem <b>dentro</b> do app,
      com <b>⤢ Tela cheia</b> e <b>↩ Voltar ao normal</b>.</li>
    <li><b>📚 Equipamentos</b>: conexões salvas — 1 clique para conectar; importa CSV/JSON e as sessões do PuTTY; exporta CSV.</li>
    <li>O relógio na aba mostra há quanto tempo a sessão está aberta. <kbd>Enter</kbd> no campo de endereço já conecta.</li>
    <li>Selecionar texto = copiar · botão direito = colar.</li></ul>
    <p><b>📡 Compartilhar</b> (ao vivo): gera um código <b>ABCD-EFGH-JKLM</b>. O colega abre o DASSH Console dele →
      <b>🔗 Entrar</b> → digita o código → você <b>aprova</b>. Ele vê tudo ao vivo; pode <b>pedir o controle</b> para digitar.
      <span style="color:#8df0cc">● verde = ATIVO (digitando)</span> · <span style="color:#ffd98a">● amarelo = observando</span>.
      Você retoma o controle ou remove alguém a qualquer momento. <b>✉ Convidar</b> manda pelo WhatsApp (para qualquer contato ou
      grupo) a mensagem pronta com o link de download e o código.</p>
    <p class="nota">Ponta a ponta cifrado (AES-256 + X25519): só quem você aprova consegue ler. Se o cabo USB-serial mandar lixo,
      o app reabre a porta sozinho.</p>`],
  cofre: ["Cofre de credenciais", `
    <ul><li>Cadastre <b>nome</b>, <b>usuário</b>, <b>senha</b> e <b>vale para</b> (ex.: COM8, 10.0.0.1).</li>
    <li>Quando o terminal pedir <b>Username/login</b>, aparece a barra <b>“Pediu usuário”</b>: escolha a credencial — o usuário
      é digitado e a senha é completada sozinha no <b>Password</b>.</li>
    <li>Se pedir só senha, a barra oferece a senha.</li></ul>
    <p class="nota">Senhas cifradas pelo Windows (DPAPI): só o seu usuário, neste PC, abre. Nunca aparecem na tela,
    em logs ou evidências.</p>`],
  historico: ["Sessões gravadas", `<p>Toda conexão é <b>gravada automaticamente</b> (selo <b style="color:#ff6b6b">REC</b> na aba).</p>
    <ul><li><b>▶ Assistir a última sessão</b>: reproduz a mais recente.</li>
    <li><b>▶ Gravação</b> em cada linha: reproduz aquela sessão (1x/2x/4x/10x, barra para pular).</li>
    <li>Clicar no <b>REC</b> da aba: assiste a sessão atual até o momento.</li>
    <li><b>Log</b>: o texto completo da sessão · <b>Reconectar</b>: abre de novo a mesma conexão.</li></ul>`],
};
function abrirInfo(btn) {
  const pop = $("#popover"), [tit, corpo] = INFO[btn.dataset.info] || ["", ""];
  if (btn.classList.contains("aberto")) return fecharInfo();
  fecharInfo();
  $("#pop-tit").innerHTML = `<span class="info aberto">i</span>${tit}`; $("#pop-corpo").innerHTML = corpo;
  pop.classList.remove("oculto"); btn.classList.add("aberto");
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8), y = r.bottom + 8;
  if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);  // sem espaço embaixo: abre para cima
  pop.style.left = x + "px"; pop.style.top = y + "px";
}
function fecharInfo() {
  $("#popover").classList.add("oculto");
  document.querySelectorAll(".info.aberto").forEach((b) => b.classList.remove("aberto"));
}

// ================= atalhos =================
function atalho(e) {
  if (e.type !== "keydown" || !e.ctrlKey || !e.altKey) return false;
  const k = e.key.toLowerCase();
  if (k === "l") { limpar(); return true; }
  if (k === "p") { evidencia(false); return true; }
  if (k === "e") { evidencia(true); return true; }
  if (k === "t") { novaAba(); return true; }
  if (/^[1-8]$/.test(k)) { const id = ordemAbas()[+k - 1]; if (id) ativar(id); return true; }
  return false;
}

// ================= início =================
window.addEventListener("pywebviewready", async () => {
  api = window.pywebview.api;
  const ini = await api.inicial();
  NOME = ini.cfg.nome || ""; MODO_TESTE = ini.teste || "";
  cofre = ini.cofre || [];
  await carregarPortas(ini.portas);
  $("#baud").value = String(ini.cfg.baud || 9600);
  $("#ssh-destino").value = ini.cfg.ssh || "";
  $("#web-url").value = ini.cfg.web || "";
  aplicarTema(ini.cfg.tema || "dassh");
  desenharClientes(ini.clientes);
  atualizarEvid(ini.evid);
  atualizarWa({ conversa: ini.cfg.conversa });
  onFila(await api.fila_status());   // envios que ficaram pendentes da última vez
  novaAba("serial");
  if (ini.conflito_atalhos)
    toast("A janelinha antiga “Evidências PuTTY” está aberta e captura Ctrl+Alt+L/P. Feche-a ou use os botões.", "aviso");

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharInfo(); if (atalho(e)) e.preventDefault(); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-info]");
    if (b) { e.stopPropagation(); abrirInfo(b); return; }
    if (!e.target.closest("#popover")) fecharInfo();
  });
  document.querySelectorAll("#abas button").forEach((b) => b.addEventListener("click", () => {
    const a = A(); if (a && a.conectado) return toast("Desconecte esta aba ou abra uma nova (＋) para outro tipo", "aviso");
    selecionarTipo(b.dataset.tipo);
  }));
  $("#porta").addEventListener("mousedown", () => carregarPortas());
  $("#atualizar-portas").onclick = () => carregarPortas();
  $("#diag-cabo").onclick = diagnosticarCabo;
  $("#liberar-porta").onclick = () => liberarPorta();
  LIMPAR_APOS = ini.cfg.limpar_apos !== false; $("#tg-limpar").classList.toggle("on", LIMPAR_APOS);
  $("#tg-limpar").onclick = () => { LIMPAR_APOS = !LIMPAR_APOS; $("#tg-limpar").classList.toggle("on", LIMPAR_APOS);
    api.salvar_pref("limpar_apos", LIMPAR_APOS); toast(LIMPAR_APOS ? "A tela será limpa depois de cada evidência" : "A tela não será mais limpa sozinha"); };
  let GRAVAR = ini.cfg.gravar_auto !== false; $("#tg-gravar").classList.toggle("on", GRAVAR);
  $("#tg-gravar").onclick = () => { GRAVAR = !GRAVAR; $("#tg-gravar").classList.toggle("on", GRAVAR); api.salvar_pref("gravar_auto", GRAVAR);
    toast(GRAVAR ? "⏺ Sessões novas serão gravadas (pare em cada aba pelo REC)"
                 : "Sessões novas NÃO serão gravadas — só log em texto (grave uma aba pelo REC se precisar)"); };
  $("#tg-ativa").onclick = async () => {
    const a = A(); if (!a || !a.conectado) return toast("Conecte a aba primeiro", "aviso");
    const r = await api.manter_ativa(a.id, !a.manterAtiva); a.manterAtiva = r.ativo;
    $("#tg-ativa").classList.toggle("on", a.manterAtiva); toast(r.msg);
  };
  // Enter no endereço = Conectar
  ["#web-url", "#ssh-destino"].forEach((s) => $(s).addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); conectar(); } }));
  // cronômetro de cada aba conectada
  setInterval(() => abas.forEach((a) => {
    const el = a.btn && a.btn.querySelector(".tempo"); if (!el) return;
    if (!a.conectado || !a.inicio) return (el.textContent = "");
    const s = Math.floor((Date.now() - a.inicio) / 1000), h = Math.floor(s / 3600);
    el.textContent = (h ? h + ":" : "") + pad2(Math.floor((s % 3600) / 60)) + ":" + pad2(s % 60);
  }), 1000);
  document.querySelectorAll("[data-rede]").forEach((b) => (b.onclick = () => abrirRede(b.dataset.rede, null)));
  if ((ini.rede_temp || []).length) setTimeout(oferecerRemoverRede, 1500);   // sobrou IP temporário de outra vez
  $("#cabo-de-novo").onclick = diagnosticarCabo;
  $("#conectar").onclick = () => conectar();
  $("#nova-aba").onclick = () => novaAba();
  $("#limpar").onclick = limpar;
  $("#salvar").onclick = () => evidencia(false);
  $("#enviar").onclick = () => evidencia(true);
  $("#abrir-pasta").onclick = () => api.abrir_pasta();
  $("#wa-fila").onclick = abrirFila;
  $("#wa-andamento").onclick = abrirFila;
  $("#hist-ultima").onclick = async () => {
    const h = (await api.historico()).find((r) => r.grav_existe);
    if (!h) return toast("Nenhuma sessão gravada ainda", "aviso");
    $("#modal-hist").classList.add("oculto"); tocarGravacao(h.gravacao, `${h.nome} — ${h.inicio.slice(8, 10)}/${h.inicio.slice(5, 7)} ${h.inicio.slice(11, 16)}`);
  };
  $("#btn-roteiro").onclick = abrirRoteiros;
  $("#btn-relatorio").onclick = async () => {   // já tem relatório? oferece ver/assinar o último ou gerar outro
    const ult = await api.pdf_ultimo();
    if (!ult) return gerarRelatorio();
    pedido(`📄 <b>Relatório do atendimento</b><br><small>Último: ${esc(ult.split("\\").pop())}</small>`, "Gerar novo",
      "Ver / assinar o último", (novo) => (novo ? gerarRelatorio() : abrirPdf(ult)));
  };
  iniciarRubrica(); iniciarEquip(); iniciarLogo();
  $("#btn-todas-ev").onclick = abrirEvidencias;
  $("#lista-abas").onclick = listaAbas;
  $("#abas-sessao").addEventListener("wheel", (e) => { if (e.deltaY) { e.preventDefault(); $("#abas-sessao").scrollLeft += e.deltaY; } }, { passive: false });
  new ResizeObserver(ajustarDepois).observe($("#terminal")); addEventListener("resize", ajustarDepois);
  setInterval(ajustarFonte, 2000);   // segurança: troca de tema/fonte
  $("#rot-executar").onclick = () => { if (!rotSel) return; $("#modal-roteiro").classList.add("oculto"); executarRoteiro(rotSel, $("#rot-enviar").checked); };
  $("#btn-compartilhar").onclick = () => compartilhar();
  $("#btn-entrar").onclick = () => entrarSessao();
  $("#btn-tema").onclick = (e) => { e.stopPropagation(); abrirTemas(); };
  document.addEventListener("mousedown", (e) => { if (!e.target.closest("#tema-pop, #btn-tema")) $("#tema-pop").classList.add("oculto"); });
  $("#cliente-sel").onchange = async (e) => {
    const r = await api.usar_cliente(e.target.value);
    if (!r.ok) return toast(r.erro, "erro");
    atualizarEvid(r.evid); toast("Cliente: " + r.atual);
  };
  $("#novo-cliente").onclick = novoCliente;
  $("#renomear-visita").onclick = renomearVisita; $("#nova-visita").onclick = novaVisita; $("#importar-arquivos").onclick = async () => { const r = await api.importar_arquivos(); if (r.cancelado) return; toast(r.ok ? `📥 ${r.arquivos} arquivo(s) importado(s) para o atendimento — entram no relatório com SHA-256` : r.erro, r.ok ? "" : "erro"); };
  $("#trocar-raiz").onclick = async () => { const c = await api.escolher_raiz(); desenharClientes(c); toast("Pasta raiz: " + c.raiz); };
  $("#btn-historico").onclick = abrirHistorico;
  $("#btn-cofre").onclick = abrirCofre;
  $("#sug-fechar").onclick = () => { const a = A(); if (a) esconderSugestao(a); };
  document.querySelectorAll("[data-fecha]").forEach((b) => (b.onclick = () => fecharModal(b)));
  document.querySelectorAll(".modal").forEach((m) => m.addEventListener("mousedown", (e) => { if (e.target === m) m.classList.add("oculto"); }));
  $("#cf-limpar").onclick = limparFormCofre;
  $("#cofre-form").onsubmit = async (e) => {
    e.preventDefault();
    const r = await api.cofre_salvar({ id: $("#cf-id").value || null, nome: $("#cf-nome").value, usuario: $("#cf-usuario").value,
                                       senha: $("#cf-senha").value, alvo: $("#cf-alvo").value });
    if (!r.ok) return toast(r.erro, "erro");
    cofre = r.itens; desenharCofre(); limparFormCofre(); toast("Credencial salva no cofre");
    const a = A(); if (a && a.sugestao) mostrarSugestao(a, a.sugestao);
  };
  $("#wa-abrir").onclick = async () => {
    toast("Abrindo o WhatsApp Web…");
    const r = await api.wa_abrir();
    if (!r.ok) return toast(r.erro, "erro");
    atualizarWa(r); if (!r.logado) toast("Leia o QR code no WhatsApp (só na primeira vez)", "aviso");
  };
  $("#wa-conectar").onclick = async () => {
    const r = await api.wa_usar_conversa();
    if (!r.ok) return toast(r.erro, "erro");
    atualizarWa(await api.wa_status()); toast("Conversa conectada: " + r.conversa);
  };
  setInterval(async () => { atualizarWa(await api.wa_status()); atualizarEvid(await api.evid_status()); }, 8000);
  // vigia as portas COM: cabo conectado/desconectado aparece sozinho (e o cabo console novo já fica selecionado)
  let assinaturaPortas = JSON.stringify(ini.portas.map((p) => p.porta));
  setInterval(async () => {
    const lista = await api.portas(), sig = JSON.stringify(lista.map((p) => p.porta));
    if (sig === assinaturaPortas) return;
    const antes = JSON.parse(assinaturaPortas); assinaturaPortas = sig;
    const nova = lista.find((p) => !antes.includes(p.porta));
    await carregarPortas(lista);
    if (nova) {
      const a = A();
      if (a && !a.conectado && a.tipo === "serial") $("#porta").value = nova.porta;
      toast(`Porta detectada: ${nova.porta} — ${nova.descricao}`);
    } else toast("Uma porta COM foi desconectada", "aviso");
  }, 3000);
  const sp = $("#splash"); sp.classList.add("sai"); setTimeout(() => sp.remove(), 300);   // pronto: some a abertura
  if (!ini.teste) setTimeout(async () => {   // WhatsApp já logado antes: abre sozinho, minimizado (fila funciona sem cliques)
    const w = await api.wa_auto();
    if (w.ok) { atualizarWa(await api.wa_status()); if (w.logado) toast("WhatsApp pronto (aberto minimizado)"); }
  }, 2500);
  if (ini.teste === "1") autoteste();
  else if (ini.teste === "auditoria") testeAuditoria();
  else if (ini.teste === "visual") testeVisual();
  else if (ini.teste === "fila") testeFila();
  else if (ini.teste === "web") testeWeb();
  else if (ini.teste === "pdf") testePdf();
  else if (ini.teste === "convite") testeConvite();
  else if (ini.teste === "java") testeJava();
  else if (ini.teste === "layout") testeLayout();
  else if (ini.teste === "demo") (async () => { const e = (ms) => new Promise((r) => setTimeout(r, ms));
    await e(800); demoIniciar(A()); for (const s of [6, 14, 24, 36]) { await e(s === 6 ? 6000 : (s - 6) * 400); api.teste_fim("DEMO " + s); }
    const n = document.querySelectorAll("#historico li.ev-item").length; evidencia(false); await e(800);
    api.teste_fim("SEM_EVIDENCIA " + (document.querySelectorAll("#historico li.ev-item").length === n)); await e(500); api.teste_fim("TEMAS"); })();
  else if (ini.teste === "abas") testeAbas();
  else if (ini.teste === "excluir") (async () => {   // evidências: listar, excluir pela tela, custódia; sessão: excluir; PDF
    const e = (ms) => new Promise((r) => setTimeout(r, ms));
    selecionarTipo("powershell"); A().tipo = "powershell"; await conectar(); await e(1500);
    for (const c of ["Get-Date", "hostname", "whoami"]) { api.escrever(A().id, c + "\r"); await e(1200); await evidencia(false); await e(1500); }
    await conectar(A()); await e(800);   // desconecta (a sessão fica no histórico)
    await abrirEvidencias(); await e(1200);
    const antes = EVS.length; api.teste_fim("LISTA " + antes); await e(1500);
    document.querySelector("#ev-grade .ev-card [data-x]").click(); await e(300);
    document.querySelector("#pedidos .pedido [data-s]").click(); await e(1500);
    const depois = EVS.length;
    try {
      $("#modal-evid").classList.add("oculto");
      await abrirHistorico(); await e(600); api.teste_fim("HIST " + HIST.length); await e(1200);
      const hx = await api.hist_excluir(HIST[0].id); HIST = await api.historico(); desenharHist(); await e(600);
      const rel = await api.relatorio_gerar();
      api.teste_fim(JSON.stringify({ evid_antes: antes, evid_depois: depois, sessao_excluida: hx.ok, arquivos_na_lixeira: hx.arquivos,
        hist_restante: HIST.length, pdf_ok: rel.ok, pdf_evidencias: rel.evidencias, pdf_erro: rel.erro || null }));
    } catch (err) { api.teste_fim(JSON.stringify({ erro_js: String(err && err.stack || err).slice(0, 400) })); }
  })();
  else if (ini.teste === "pedidos") (async () => {   // avisos sem empilhar, REC na hora, liberar porta inexistente
    const e = (ms) => new Promise((r) => setTimeout(r, ms)), n = () => document.querySelectorAll("#pedidos .pedido").length;
    selecionarTipo("powershell"); A().tipo = "powershell"; await conectar(); await e(1500);
    menuGravacao(A()); menuGravacao(A()); menuGravacao(A()); await e(400);
    const tres = n(); document.querySelector("#pedidos .pedido [data-s]").click(); await e(100);
    const recNaHora = A().gravando === false && n() === 0; await e(1500);
    menuGravacao(A()); await e(300); document.querySelector("#pedidos .pedido-x").click(); await e(200);
    const x = n(); const t0 = Date.now(); const cl = await api.area_transferencia(); const ms = Date.now() - t0;
    const lp = await api.porta_liberar("COM99");
    api.teste_fim(JSON.stringify({ avisos_apos_3_cliques: tres, rec_parou_na_hora: recNaHora, rec_confirmado: A().gravando,
      x_fechou: x === 0, clipboard_ms: ms, clipboard_tipo: typeof cl, liberar_com99: lp.ok ? "livre?" : (lp.erro || "").slice(0, 60) }));
  })();
  else if (ini.teste === "tempo") testeTempo();
  else if (ini.teste === "ssh") testeSsh();
  else if (ini.teste === "share-host") testeDono();
  else if (ini.teste === "demo-dono") demoDono();
  else if (ini.teste === "visita") (async () => {   // ＋ nova visita: evidência cai na pasta nova; outra visita = outro PDF
    const e = (ms) => new Promise((r) => setTimeout(r, ms));
    selecionarTipo("powershell"); A().tipo = "powershell"; await conectar(); await e(1500);
    api.escrever(A().id, "hostname\r"); await e(1000); await evidencia(false); await e(1500);
    const v1 = (await api.evid_status()).visita_nome;
    const r = await api.nova_visita("SW4 teste"); await e(300);
    api.escrever(A().id, "whoami\r"); await e(1000); await evidencia(false); await e(1500);
    const st = await api.evid_status(), ev = await api.evid_lista(), rel = await api.relatorio_gerar();
    api.teste_fim(JSON.stringify({ visita1: v1, nova_ok: r.ok, visita_atual: st.visita_nome, evid_na_nova: (ev.itens || []).length,
      pdf_ok: rel.ok, pdf_evid: rel.evidencias, pdf_na_nova: (rel.pdf || "").includes("SW4 teste") }));
  })();
  else if (ini.teste === "demo-assistir") entrarSessao(ini.codigo_teste);
  else if (ini.teste === "share-guest") testeConvidado(ini.codigo_teste);
});

// ---- autoteste SSH embutido (servidor público de testes) + diagnóstico do cabo ----
async function testeSsh() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("ssh"); $("#ssh-destino").value = "demo@test.rebex.net";
  await conectar();
  const a = A(); let t = Date.now();
  while (!/password:\s*$/.test(linhaCursor(a.term)) && Date.now() - t < 20000) await espera(100);
  await espera(600);
  const sug = !$("#sugestao").classList.contains("oculto");
  api.teste_fim("SENHA sugestao_cofre=" + sug);
  await espera(1500);
  api.escrever(a.id, "password\r"); t = Date.now();
  while (!/\$\s*$/.test(linhaCursor(a.term)) && Date.now() - t < 20000) await espera(100);
  api.escrever(a.id, "ls\r"); await espera(2000);
  await evidencia(false); await espera(1200);
  api.teste_fim("SHELL ok=" + /readme\.txt/.test(snapshot(a.term).texto));
  await espera(2500);
  selecionarTipo("serial"); diagnosticarCabo(); await espera(3500);
  api.teste_fim("DIAG");
}

// ---- autoteste de tempo: janela pronta -> conectar PowerShell -> prompt na tela ----
async function testeTempo() {
  const pronto = Date.now();
  api.teste_fim("PRONTO");
  selecionarTipo("powershell");
  const t0 = Date.now(); await conectar();
  const a = A();
  while (!/PS [A-Z]:\\.*>\s*$/.test(linhaCursor(a.term)) && Date.now() - t0 < 15000) await new Promise((r) => setTimeout(r, 30));
  api.teste_fim(`PROMPT conectar->prompt=${Date.now() - t0}ms`);
}

// ---- estresse de abas: 8 abas (3 conectadas), lista ▾, tentativa da 9ª ----
async function testeAbas() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); A().tipo = "powershell"; await conectar(); await espera(1500);
  api.escrever(A().id, "dir\r"); await espera(1200);
  api.teste_fim("UMA"); await espera(1500);
  for (let i = 0; i < 7; i++) {
    const a = novaAba(i % 2 ? "cmd" : "powershell");
    if (i < 2) { await conectar(a); await espera(1200); }
    await espera(300);
  }
  ativar(ordemAbas()[1]); await espera(800);
  api.teste_fim("OITO n=" + abas.size); await espera(1500);
  novaAba("cmd"); await espera(500);
  listaAbas(); await espera(800);
  api.teste_fim("LISTA n=" + abas.size); await espera(1500);
  $("#menu-abas").classList.add("oculto"); api.teste_fim("TEMAS");
}

// ---- autoteste do layout em janela pequena (DASSH_JANELA=LxA): terminal, barra e lista grande de equipamentos ----
async function testeLayout() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("serial"); await carregarPortas(); await espera(1200);
  api.teste_fim("SERIAL topo=" + Math.round($(".topo").getBoundingClientRect().height) + "px"); await espera(1500);
  selecionarTipo("web"); await espera(800);
  api.teste_fim("WEB topo=" + Math.round($(".topo").getBoundingClientRect().height) + "px"); await espera(1500);
  selecionarTipo("powershell"); A().tipo = "powershell"; await conectar(); await espera(2500);
  api.escrever(A().id, "Get-ChildItem C:\\Windows | Select-Object -First 40\r"); await espera(2500);
  A().term.focus(); await espera(800);
  api.teste_fim(`TERM fonte=${A().term.options.fontSize} logo_dif_ms=${window.__logoDif()}`); await espera(1500);
  let g = await api.gravacao_ligar(A().id, false); A().gravando = g.gravando; desenharRec(A());
  api.escrever(A().id, "echo depois-de-parar\r"); await espera(1200);
  api.teste_fim("REC_OFF gravando=" + g.gravando); await espera(1200);
  g = await api.gravacao_ligar(A().id, true); A().gravando = g.gravando; desenharRec(A());
  api.teste_fim("REC_ON gravando=" + g.gravando + " arq=" + String(await api.gravacao_aba(A().id)).split("\\").pop()); await espera(1200);
  for (let i = 1; i <= 75; i++)
    await api.equip_salvar({ nome: `Equipamento ${String(i).padStart(2, "0")}`, tipo: ["ssh", "web", "serial"][i % 3],
      destino: i % 3 === 1 ? `https://10.0.${i}.20` : i % 3 === 2 ? `COM${i % 9 + 1}:9600` : `admin@10.0.${i}.1`, grupo: `Site ${i % 5}` });
  await abrirEquip(); await espera(1200);
  api.teste_fim("EQUIP"); await espera(2000);
  $("#modal-equip").classList.add("oculto"); abrirModal("#modal-hist"); await espera(1200);
  api.teste_fim("HIST"); await espera(1500); api.teste_fim("TEMAS");
}

// ---- autoteste do console Java encaixado (simulador BMC em https://127.0.0.1:8443) ----
async function testeJava() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("web"); A().tipo = "web"; $("#web-url").value = "https://127.0.0.1:8443";
  await conectarWeb(A(), true); await espera(3000);
  await api.teste_web_js(A().id, "() => { document.querySelector('[name=s]').value = 'calvin'; document.querySelector('form').submit(); }");
  await espera(3000);
  capturarWeb(A(), false); await espera(3000);
  api.teste_fim("PAINEL janelas=" + (A().janelas || []).length);
  await api.teste_web_js(A().id, "() => { location.href = '/viewer.jnlp'; }");
  for (let i = 0; i < 60 && !(A().janelas || []).some((x) => x.java); i++) await espera(1000);
  await espera(4000);
  api.teste_fim("JAVA " + JSON.stringify((A().janelas || []).map((x) => [x.titulo, x.java, x.ativa])));
  await espera(1500);
  capturarWeb(A(), false); await espera(4000);
  api.teste_fim("CAPTURA " + document.querySelectorAll("#historico li.ev-item").length);
  await espera(1500);
  const nav = (A().janelas || []).find((x) => !x.java);
  if (nav) { await api.web_mostrar(A().id, nav.h); A().janelas = await api.web_janelas(A().id); desenharBarraWeb(A()); }
  await espera(2500); api.teste_fim("ALTERNOU");
  await espera(2000); api.teste_fim("TEMAS");
}

// ---- autoteste: convite (sem enviar) e lista de equipamentos ----
async function testeConvite() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); A().tipo = "powershell"; await conectar(); await espera(2500);
  await abrirConvite(); await espera(1500);
  $("#cv-link").value = "https://github.com/dassh-it/dassh-console/releases/latest"; $("#cv-link").oninput(); $("#cv-para").value = "Cláudio";
  api.teste_fim("CONVITE"); await espera(2500);
  $("#modal-convite").classList.add("oculto");
  await api.equip_salvar({ nome: "iDRAC R750 (simulador)", tipo: "web", destino: "https://127.0.0.1:8443", grupo: "Bancada" });
  await api.equip_salvar({ nome: "SW Huawei S5732 bancada", tipo: "serial", destino: "COM8:9600", grupo: "Bancada" });
  await api.equip_salvar({ nome: "SW Core RJ", tipo: "ssh", destino: "admin@10.10.0.1", grupo: "Cliente X", obs: "VRP 8" });
  await abrirEquip(); await espera(1000);
  api.teste_fim("EQUIP"); await espera(2500); api.teste_fim("TEMAS");
}

// ---- autoteste do PDF: gera, abre dentro do app, desenha rubrica, assina e datar ----
async function testePdf() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const r = await api.relatorio_gerar();
  await abrirPdf(r.pdf); await espera(2500);
  $("#pdf-nome").value = "Fulano de Tal (teste)";
  const g = $("#pdf-rub").getContext("2d"); g.lineWidth = 5; g.strokeStyle = "#1a2f8a"; g.beginPath();
  [[30, 130], [120, 40], [200, 150], [300, 50], [420, 140], [530, 70]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke(); $("#pdf-rub").dataset.usada = "1";
  api.teste_fim("ABERTO"); await espera(2000);
  $("#pdf-assinar").click(); await espera(5000);
  const f = $("#pdf-ver").contentWindow; try { f.location.hash = "page=5"; } catch (_) {}
  $("#pdf-ver").src = abrirPdf.url + "#page=5&zoom=90"; await espera(2500);
  api.teste_fim("ASSINADO " + $("#pdf-tit").textContent + " | " + $("#pdf-quadros").textContent.replace(/\s+/g, " "));
  await espera(2000); api.teste_fim("TEMAS");
}

// ---- autoteste da aba Web: abre página, captura evidência, abre a vitrine de temas ----
async function testeWeb() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("web"); $("#web-url").value = "https://example.com";
  await conectar(); await espera(4000);
  api.teste_fim("ABERTO janelas=" + (A().janelas || []).length);
  await espera(2500);
  capturarWeb(A(), false); await espera(2500);
  const n = document.querySelectorAll("#historico li.ev-item").length;
  api.teste_fim("CAPTURA " + n);
  await espera(3000);
  await telaCheia(true); await espera(1500);
  api.teste_fim("CHEIA");
  await espera(3000);
  await telaCheia(false); await espera(1500);
  api.teste_fim("NORMAL");
  await espera(3000);
  abrirTemas(); await espera(800);
  api.teste_fim("TEMAS");
}

// ---- autoteste da fila: 3 envios com WhatsApp fechado -> andamento + painel da fila ----
async function testeFila() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); await conectar(); await espera(2500);
  api.escrever(ativa, "Get-Date\r"); await espera(1500);
  evidencia(true); evidencia(true); evidencia(true);
  await filaCaptura; await espera(4000);
  api.teste_fim("ANDAMENTO " + $("#wa-andamento").textContent.trim());
  await espera(1500); await abrirFila(); await espera(1500);
  api.teste_fim("FILA " + document.querySelectorAll("#fila-linhas tr").length);
}

// ---- autoteste visual: rajada de capturas, miniaturas, evidência ampliada e player ----
async function testeVisual() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); await conectar(); await espera(2500);
  api.escrever(ativa, "Get-Date; Get-Process | Select-Object -First 8 Name,Id,CPU | Format-Table -AutoSize\r"); await espera(3000);
  evidencia(false); evidencia(false); evidencia(false);          // 3 cliques seguidos (sem await)
  await filaCaptura; await espera(800);
  api.teste_fim("RAJADA " + document.querySelectorAll("#historico li.ev-item").length);
  await espera(2500);
  document.querySelector("#historico li.ev-item").click(); await espera(2500);
  api.teste_fim("LB");
  await espera(5000);
  $("#modal-lb").classList.add("oculto");
  const h = await api.historico(); await tocarGravacao(h[0].gravacao, "Teste"); await espera(4000);
  api.teste_fim("PLAYER");
}

// ---- autoteste: dados do atendimento -> roteiro completo -> relatório PDF ----
async function testeAuditoria() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const d = await api.dados_visita("Teste auditoria", "CHG0004567", "Fulano de Tal — Redes");
  atualizarEvid(d.evid);
  selecionarTipo("powershell"); await conectar(); await espera(3000);
  const rots = await api.roteiros(), rot = rots.find((r) => r.arquivo === "windows_servidor.json");
  await executarRoteiro(rot, false);
  const r = await api.relatorio_gerar();
  await espera(500);
  api.teste_fim(JSON.stringify({ roteiro: rot.nome, rel_ok: r.ok, pdf: r.pdf, evidencias: r.evidencias, logs: r.logs,
    gravacoes: r.gravacoes, erro: r.erro || null }));
}

// ---- autotestes do compartilhamento (duas instâncias do app conversando) ----
// ---- demonstração do compartilhamento: o "dono" digita sozinho, devagar; o convidado só assiste ----
async function demoDono() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); await conectar(); await espera(2500);
  const codigo = await compartilhar();
  api.teste_fim("CODIGO " + codigo);
  const digitar = async (txt) => { for (const ch of txt) { api.escrever(A().id, ch); await espera(90 + Math.random() * 120); } api.escrever(A().id, "\r"); };
  await espera(12000);   // tempo para o convidado entrar e ser aprovado
  const cmds = ["Write-Host 'Ola! Voce esta assistindo ao vivo a minha aba do DASSH Console' -ForegroundColor Green",
    "Get-Date", "hostname", "Get-ComputerInfo -Property OsName, OsVersion, CsProcessors | Format-List",
    "Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress | Format-Table",
    "Test-Connection 8.8.8.8 -Count 3 | Select-Object Address, Latency", "cls",
    "Write-Host 'Tudo o que eu digito aparece na sua tela, letra por letra.' -ForegroundColor Cyan",
    "Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Name, CPU | Format-Table"];
  for (let volta = 0; volta < 3; volta++) for (const c of cmds) { await digitar(c); await espera(4500); }
  api.teste_fim("TEMAS");
}
async function testeDono() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); await conectar(); await espera(2500);
  api.escrever(ativa, "Write-Host 'TELA-DO-DONO'\r"); await espera(1500);
  const codigo = await compartilhar();
  api.teste_fim("CODIGO " + codigo);                    // o script lê e passa para o convidado
  for (let i = 0; i < 90; i++) {                        // espera o convidado digitar algo
    await espera(1000);
    if (/REMOTO-OK/.test(snapshot(A().term).texto)) break;
  }
  const s = A().share || {};
  api.teste_fim(JSON.stringify({ papel: "dono", recebeu_digitacao_remota: /REMOTO-OK/.test(snapshot(A().term).texto),
    participantes: (s.participantes || []).map((p) => `${p.nome}:${p.ativo ? "ATIVO" : "observando"}`), sou_ativo: s.souAtivo }));
}
async function testeConvidado(codigo) {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const a = await entrarSessao(codigo);
  for (let i = 0; i < 60 && (!a.share || a.share.aguardando); i++) await espera(500);
  await espera(2500);
  const viuTela = /TELA-DO-DONO/.test(snapshot(a.term).texto);
  api.escrever(a.id, "echo SEM-CONTROLE\r"); await espera(1000);    // sem controle: deve ser ignorado
  api.share_pedir(a.id);
  for (let i = 0; i < 40 && !(a.share && a.share.souAtivo); i++) await espera(500);
  const ativo = !!(a.share && a.share.souAtivo);
  api.escrever(a.id, "Write-Host ('REMOTO' + '-OK')\r"); await espera(3000);
  const viuEco = /REMOTO-OK/.test(snapshot(a.term).texto);
  await new Promise((r) => setTimeout(r, 1500));
  api.teste_fim(JSON.stringify({ papel: "convidado", viu_tela_do_dono: viuTela, virou_ativo: ativo, viu_resultado: viuEco,
    participantes: (a.share.participantes || []).map((p) => `${p.nome}:${p.ativo ? "ATIVO" : "observando"}`) }));
}

// Autoteste (só com DASSH_TESTE=1): 2 abas (PowerShell + CMD), evidência em cada, login simulado no cofre
async function autoteste() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  selecionarTipo("powershell"); await conectar(); await espera(2500);
  api.escrever(ativa, "Get-Date -Format 'dd/MM/yyyy HH:mm'\r"); await espera(3000);
  await evidencia(false); await espera(1000);
  const b = novaAba("cmd"); selecionarTipo("cmd"); await conectar(b); await espera(2000);
  api.escrever(b.id, "ver\r"); await espera(2000);
  await evidencia(false); await espera(1000);
  // cofre: credencial de teste -> prompt Username -> clica na sugestão -> Password é completado sozinho
  await api.cofre_salvar({ nome: "TESTE", usuario: "usuario_teste", senha: "senha_teste_123", alvo: "" });
  cofre = await api.cofre_listar();
  api.escrever(b.id, "set /p U=Username: \r"); await espera(2000);
  const sug = !$("#sugestao").classList.contains("oculto");
  const bt = $("#sug-itens button"); if (bt) bt.click(); await espera(1500);
  api.escrever(b.id, "set /p P=Password: \r"); await espera(2500);
  const sumiu = $("#sugestao").classList.contains("oculto");
  api.escrever(b.id, "echo RESULTADO=[%U%][%P%]\r"); await espera(1500);
  const t = snapshot(b.term).texto, ms = [...t.matchAll(/^RESULTADO=\[([^\]]*)\]\[([^\]]*)\]/gm)], m = ms.pop();
  for (const c of cofre) if (c.nome === "TESTE") await api.cofre_remover(c.id);
  api.teste_fim(JSON.stringify({ abas: abas.size, sugestao: sug, sugestao_sumiu: sumiu,
    usuario_ok: !!m && m[1] === "usuario_teste", senha_ok: !!m && m[2] === "senha_teste_123" }));
}
