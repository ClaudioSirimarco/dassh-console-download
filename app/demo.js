// ================= 🎬 Modo demonstração =================
// "Filme de hacker" para mostrar o app: a aba digita comandos e respostas sozinha.
// É SÓ ANIMAÇÃO: nada é executado, nada sai do computador, não grava, não gera evidência, não usa o Python.
// Economiza recursos: só avança enquanto a aba está à vista (outra aba / app minimizado = pausa).
// Acesso: botão direito na aba → "🎬 Modo demonstração". Esc para · qualquer tecla acelera.

const DEMO = (() => {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (l) => l[r(0, l.length - 1)];
  const hex = (n) => [...Array(n)].map(() => "0123456789abcdef"[r(0, 15)]).join("");
  const ip = () => `10.${r(10, 60)}.${r(0, 254)}.${r(2, 250)}`;
  const C = { v: "\x1b[1;32m", vc: "\x1b[32m", a: "\x1b[1;33m", az: "\x1b[1;34m", ci: "\x1b[36m", vm: "\x1b[1;31m",
              mg: "\x1b[35m", c: "\x1b[90m", b: "\x1b[1m", z: "\x1b[0m" };
  const PROMPT = () => `${C.v}root@dassh-ops${C.z}:${C.az}~${C.z}# `;
  const HOSTS = ["core-sw01", "dist-sw02", "edge-fw01", "srv-db-07", "srv-app-12", "bkp-nas01", "wlc-ctrl03", "lb-vip-02"];
  return { r, pick, hex, ip, C, PROMPT, HOSTS };
})();

function demoAtivo(a) { return a && a.demo && a.demo.on && abas.has(a.id); }

function demoTecla(a, d) {
  if (d === "\x1b") return demoParar(a);
  a.demo.turbo = Date.now() + 1500;   // "digitação de hacker": apertar teclas acelera
}

function demoParar(a) {
  if (!a.demo) return;
  a.demo.on = false; a.demo = null;
  a.term.write("\x1b[0m\r\n\x1b[90m[demonstração encerrada]\x1b[0m\r\n");
  a.nome = "Nova aba"; a.tipo = tipoTopo(); setConectado(a, false);
  toast("Demonstração encerrada");
}

function demoIniciar(a) {
  if (a.conectado) a = novaAba("powershell");        // nunca em cima de uma sessão real
  if (!a) return;
  a.demo = { on: true, turbo: 0 };
  a.nome = "🎬 Demonstração"; a.btn.querySelector(".nome").textContent = a.nome;
  a.btn.querySelector(".ponto").classList.add("on");
  arrumarAbas(); ativar(a.id);
  toast("🎬 Demonstração (simulação) — Esc para parar · qualquer tecla acelera");
  demoRodar(a);
}

async function demoRodar(a) {
  const { r, pick, hex, ip, C, PROMPT, HOSTS } = DEMO, t = a.term;
  const tick = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const pausa = async (ms) => {        // tempo só corre com a aba à vista (poupa CPU e bateria)
    let feito = 0;
    while (feito < ms && demoAtivo(a)) {
      if (a.id === ativa && !document.hidden) feito += Date.now() < a.demo.turbo ? 160 : 40;
      await tick(40);
    }
  };
  const vivo = () => demoAtivo(a);
  const dig = async (txt, vel = 42) => { for (const ch of txt) { if (!vivo()) return; t.write(ch); await pausa(vel * (0.4 + Math.random())); } };
  const cmd = async (c, host) => { t.write(host ? `${C.v}admin@${host}${C.z}> ` : PROMPT()); await pausa(350); await dig(c); await pausa(300); t.write("\r\n"); };
  const ln = async (arr, ms = 45) => { for (const l of arr) { if (!vivo()) return; t.write(l + "\r\n"); await pausa(ms * (0.5 + Math.random())); } };
  const barra = async (rot, larg = 36, vel = 70) => {
    for (let p = 0; p <= 100 && vivo(); p += r(2, 9)) {
      const n = Math.round(larg * Math.min(p, 100) / 100);
      t.write(`\r${rot.padEnd(24)} ${C.vc}[${"█".repeat(n)}${C.c}${"░".repeat(larg - n)}${C.vc}]${C.z} ${String(Math.min(p, 100)).padStart(3)}%`);
      await pausa(vel);
    }
    t.write(`\r${rot.padEnd(24)} ${C.vc}[${"█".repeat(larg)}]${C.z} 100% ${C.v}OK${C.z}\r\n`);
  };

  const CENAS = [
    async () => {   // abertura
      t.write("\x1bc"); await ln([
        `${C.v}  ██████╗  █████╗ ███████╗███████╗██╗  ██╗`, `  ██╔══██╗██╔══██╗██╔════╝██╔════╝██║  ██║`,
        `  ██║  ██║███████║███████╗███████╗███████║`, `  ██║  ██║██╔══██║╚════██║╚════██║██╔══██║`,
        `  ██████╔╝██║  ██║███████║███████║██║  ██║`, `  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝${C.z}`,
        `${C.c}  network operations · secure shell · v${r(3, 9)}.${r(0, 9)}.${r(0, 40)}${C.z}`, ""], 60);
      for (const m of ["kernel modules", "crypto engine (AES-256-GCM)", "packet capture driver", "telemetry collector", "secure tunnel"]) {
        t.write(`  [ ${C.a}....${C.z} ] loading ${m}`); await pausa(r(250, 700)); t.write(`\r  [  ${C.v}OK${C.z}  ] loading ${m}\r\n`);
      }
    },
    async () => {   // varredura da rede
      const rede = `10.${r(10, 60)}.${r(0, 254)}.0/24`;
      await cmd(`nmap -sS -sV -T4 --open ${rede}`);
      await ln([`${C.c}Starting Nmap 7.95 ( https://nmap.org )${C.z}`]);
      for (let i = 0; i < r(4, 7) && vivo(); i++) {
        const h = ip().replace(/\.\d+\.\d+$/, "") + `.${r(0, 254)}.${r(2, 250)}`;
        await ln([``, `Nmap scan report for ${C.b}${pick(HOSTS)}${C.z} (${h})`, `Host is up (0.00${r(10, 99)}s latency).`,
          `${C.c}PORT     STATE SERVICE  VERSION${C.z}`], 50);
        const portas = [["22/tcp", "ssh", "OpenSSH 9.6"], ["443/tcp", "https", "nginx 1.26"], ["161/udp", "snmp", "SNMPv3"],
                        ["3389/tcp", "ms-wbt", "Microsoft Terminal Services"], ["5432/tcp", "postgres", "PostgreSQL 16"], ["8443/tcp", "https-alt", "iDRAC 9"]];
        for (const [p, s, v] of portas.sort(() => Math.random() - 0.5).slice(0, r(2, 4)))
          await ln([`${p.padEnd(8)} ${C.v}open${C.z}  ${s.padEnd(8)} ${v}`], 40);
      }
      await ln(["", `${C.a}Nmap done:${C.z} 256 IP addresses (${r(18, 60)} hosts up) scanned in ${r(4, 19)}.${r(10, 99)} seconds`]);
    },
    async () => {   // switch core
      const host = pick(HOSTS.slice(0, 3));
      await cmd(`ssh admin@${host}`);
      await ln([`${C.c}Authenticated with key ed25519 SHA256:${hex(43)}${C.z}`, "", `Info: The max number of VTY users is 15.`, ""], 70);
      await cmd("display version", host);
      await ln([`Huawei YunShan OS`, `Version 1.${r(20, 24)}.0.1 (S5732 V200R0${r(20, 24)}C10)`, `Copyright (C) 2021-2026 Huawei Technologies Co., Ltd.`,
        `HUAWEI S5732-H48UM2CC Routing Switch uptime is ${r(10, 300)} days, ${r(1, 23)} hours, ${r(1, 59)} minutes`], 50);
      await cmd("display interface brief | include up", host);
      for (let i = 1; i <= r(6, 10) && vivo(); i++)
        await ln([`MultiGE0/0/${i}`.padEnd(22) + `${C.v}up${C.z}     ${C.v}up${C.z}      ${r(0, 40)}%  ${r(0, 40)}%   0   0`], 35);
    },
    async () => {   // descriptografando
      await cmd(`./decrypt --cipher aes-256-gcm --input capture_${hex(6)}.bin`);
      for (let i = 0; i < r(14, 22) && vivo(); i++) {
        const end = (0x7f3a0000 + i * 16).toString(16);
        const bytes = [...Array(16)].map(() => hex(2)).join(" ");
        const asc = [...Array(16)].map(() => String.fromCharCode(r(33, 126))).join("");
        await ln([`${C.c}${end}${C.z}  ${C.vc}${bytes}${C.z}  ${C.c}|${asc}|${C.z}`], 25);
      }
      await barra("  derivando chave");
      await barra("  validando integridade", 36, 45);
      await ln([`  ${C.v}✔ KEY MATCH${C.z}  ${C.b}${hex(8)}-${hex(4)}-${hex(4)}-${hex(12)}${C.z}`, ""]);
    },
    async () => {   // logs ao vivo
      await cmd("tail -f /var/log/secure-gateway.log");
      const ev = [[C.v, "INFO ", "session established"], [C.ci, "INFO ", "tunnel rekey completed"], [C.a, "WARN ", "latency above threshold"],
                  [C.v, "INFO ", "config backup stored"], [C.vm, "ALERT", "blocked inbound probe"], [C.ci, "INFO ", "health check passed"]];
      for (let i = 0; i < r(18, 30) && vivo(); i++) {
        const [cor, nv, msg] = pick(ev), d = new Date();
        await ln([`${C.c}${d.toTimeString().slice(0, 8)}.${String(r(0, 999)).padStart(3, "0")}${C.z} ${cor}${nv}${C.z} ${pick(HOSTS).padEnd(11)} ${msg} ${C.c}src=${ip()}${C.z}`], 90);
      }
      await ln([`${C.c}^C${C.z}`]);
    },
    async () => {   // implantação
      await cmd("deploy --cluster prod-edge --strategy rolling");
      for (const m of ["auth-service", "telemetry-agent", "policy-engine", "edge-proxy"]) await barra(`  ${m.padEnd(16)}`, 30, 50);
      await ln([`  ${C.v}✔ rollout concluído${C.z} — ${r(12, 48)}/${r(48, 48)} nós saudáveis · ${r(0, 2)} reinícios`, ""]);
    },
    async () => {   // acesso
      await pausa(400);
      const L = 46, lin = (s) => `${C.v}  ║${C.z}${s.padStart(Math.floor((L + s.length) / 2)).padEnd(L)}${C.v}║${C.z}`;
      await ln([`${C.v}  ╔${"═".repeat(L)}╗`, lin(""), `${C.v}  ║${C.z}${C.b}${"ACCESS GRANTED".padStart(30).padEnd(L)}${C.z}${C.v}║`,
        lin(`session ${hex(4)}-${hex(4)} · clearance level ${r(3, 5)}`), lin(""), `${C.v}  ╚${"═".repeat(L)}╝${C.z}`, ""], 90);
      await pausa(2200);
    },
  ];
  let i = 0;
  while (demoAtivo(a)) {
    await CENAS[i % CENAS.length]();
    i++;
    if (i % CENAS.length === 0) await pausa(1500);   // volta ao começo
    await pausa(r(500, 1100));
  }
}

// ---------- menu do botão direito na aba ----------
function menuAba(a, x, y) {
  let m = document.getElementById("menu-ctx");
  if (!m) { m = document.createElement("div"); m.id = "menu-ctx"; m.className = "menu-abas"; document.body.appendChild(m); }
  const it = [];
  if (a.demo) it.push(["■ Parar demonstração", () => demoParar(a)]);
  else it.push(["🎬 Modo demonstração (simulação)", () => demoIniciar(a)]);
  if (a.conectado && a.tipo !== "web" && !a.demo) it.push([a.gravando ? "⏸ Parar gravação…" : "⏺ Gravar esta aba…", () => menuGravacao(a)]);
  it.push(["✕ Fechar aba", () => fecharAba(a.id)]);
  m.innerHTML = it.map(([t], i) => `<div class="ma-item" data-i="${i}">${t}</div>`).join("") +
    (a.demo ? "" : `<div class="ma-rodape">Demonstração: só animação — não executa nada, não grava, não gera evidência.</div>`);
  m.querySelectorAll("[data-i]").forEach((el) => (el.onclick = () => { m.classList.add("oculto"); it[+el.dataset.i][1](); }));
  m.style.left = Math.min(x, innerWidth - 430) + "px"; m.style.top = y + 6 + "px";
  m.classList.remove("oculto");
  setTimeout(() => document.addEventListener("mousedown", function fora(e) {
    if (!m.contains(e.target)) { m.classList.add("oculto"); document.removeEventListener("mousedown", fora); }
  }), 0);
}
