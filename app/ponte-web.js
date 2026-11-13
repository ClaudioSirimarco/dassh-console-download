// Ponte web: roda a interface REAL do DASSH Console (index.html + app.js) no navegador, como observador de uma sessão
// compartilhada. Substitui o backend Python (window.pywebview.api) pelo protocolo dassh/v1 (mesmo do compartilhar.py):
// cada código = um tópico próprio (sessões independentes); vários observadores por sessão, cada um aprovado pelo dono.
// Nada do computador de quem compartilha (cofre, outras abas, pastas, WhatsApp) é exposto: só o shell compartilhado.
import { x25519 } from "https://esm.sh/@noble/curves@1.6.0/ed25519";
import { scryptAsync } from "https://esm.sh/@noble/hashes@1.5.0/scrypt";
import { hkdf } from "https://esm.sh/@noble/hashes@1.5.0/hkdf";
import { sha256 } from "https://esm.sh/@noble/hashes@1.5.0/sha256";

const SERVIDORES = ["wss://broker.emqx.io:8084/mqtt", "wss://test.mosquitto.org:8081/mqtt"];
const te = new TextEncoder(), td = new TextDecoder();
const b64 = (u) => btoa(String.fromCharCode(...u));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (u) => [...u].map((x) => x.toString(16).padStart(2, "0")).join("");
const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

async function fluxo(dados, Stream) {
  return new Uint8Array(await new Response(new Blob([dados]).stream().pipeThrough(new Stream("deflate"))).arrayBuffer());
}
async function cifrar(chave, obj) {
  const k = await crypto.subtle.importKey("raw", chave, "AES-GCM", false, ["encrypt"]);
  const n = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: n }, k, await fluxo(te.encode(JSON.stringify(obj)), CompressionStream)));
  const out = new Uint8Array(12 + c.length); out.set(n); out.set(c, 12); return out;
}
async function decifrar(chave, blob) {
  const k = await crypto.subtle.importKey("raw", chave, "AES-GCM", false, ["decrypt"]);
  const p = await crypto.subtle.decrypt({ name: "AES-GCM", iv: blob.slice(0, 12) }, k, blob.slice(12));
  return JSON.parse(td.decode(await fluxo(new Uint8Array(p), DecompressionStream)));
}

class Convidado {
  constructor(sid, codigo, nome) { Object.assign(this, { sid, codigo, nome, k: null, wrap: null, clientes: [], vivo: true, controle: false }); }
  async iniciar() {
    this.portaria = await scryptAsync(te.encode(this.codigo), te.encode("dassh-share-v1"), { N: 2 ** 15, r: 8, p: 1, dkLen: 32 });
    this.topico = "dassh/v1/" + hex(sha256(te.encode("topico|" + this.codigo))).slice(0, 40);
    this.priv = x25519.utils.randomPrivateKey();
    this.id = hex(crypto.getRandomValues(new Uint8Array(5)));
    await Promise.any(SERVIDORES.map((url) => new Promise((ok, falha) => {
      const c = mqtt.connect(url, { clientId: "dassh-web-" + hex(crypto.getRandomValues(new Uint8Array(6))), reconnectPeriod: 2000, connectTimeout: 12000 });
      c.on("connect", () => { c.subscribe(this.topico + "/h", { qos: 1 }); if (!this.clientes.includes(c)) this.clientes.push(c); ok(); });
      c.on("message", (_t, m) => this.receber(new Uint8Array(m)));
      c.on("error", falha); setTimeout(() => falha(new Error("tempo")), 13000);
    }))).catch(() => { throw new Error("Sem acesso ao servidor de compartilhamento (internet/firewall)."); });
    await this.publicar(await cifrar(this.portaria, { t: "entrar", id: this.id, nome: this.nome, pub: b64(x25519.getPublicKey(this.priv)) }));
    const inicio = Date.now();
    this.timer = setInterval(() => {
      if (!this.vivo) return;
      if (this.k) this.enviar({ t: "ping" });
      else if (Date.now() - inicio > 90000) this.fim("O dono da sessão não respondeu ao pedido de entrada.");
    }, 5000);
  }
  publicar(blob) { for (const c of this.clientes) if (c.connected) c.publish(this.topico + "/c", blob, { qos: 1 }); }
  async enviar(obj) { if (this.k) this.publicar(await cifrar(this.k, { ...obj, id: this.id })); }
  async receber(blob) {
    if (!this.vivo) return;
    let msg = null;
    if (this.k) msg = await decifrar(this.k, blob).catch(() => null);
    if (!msg) msg = await decifrar(this.portaria, blob).catch(() => null);
    if (!msg || (msg.para && msg.para !== this.id)) return;
    const t = msg.t;
    if (t === "aprovado" || t === "rechave") {
      if (t === "aprovado") this.wrap = hkdf(sha256, x25519.getSharedSecret(this.priv, unb64(msg.hpub)), undefined, te.encode("dassh-share-wrap"), 32);
      if (!this.wrap) return;
      this.k = unb64((await decifrar(this.wrap, unb64(msg.k))).k);
      if (t === "aprovado") window.onShare(this.sid, "aprovado", {});
    } else if (t === "negado") this.fim("O dono da sessão recusou a entrada.");
    else if (t === "out") window.termWrite(this.sid, msg.d || "");
    else if (t === "snap") window.termWrite(this.sid, "\x1bc" + (msg.d || ""));
    else if (t === "estado") { this.controle = msg.controle === this.id; window.onShare(this.sid, "estado", { ...msg, eu: this.id }); }
    else if (t === "fim") this.fim("O dono encerrou o compartilhamento.");
  }
  fim(motivo) { if (!this.vivo) return; this.fechar(); window.onDesconectado(this.sid, motivo); }
  async fechar(avisar) {
    if (avisar && this.vivo && this.k) try { await this.enviar({ t: "sair" }); } catch {}
    this.vivo = false; clearInterval(this.timer);
    setTimeout(() => this.clientes.forEach((c) => c.end(true)), 300);
  }
}

const sessoes = new Map();
const SO_NO_APP = { ok: false, erro: "Disponível no DASSH Console instalado. Aqui você acompanha a sessão compartilhada." };
const api = {
  inicial: async () => ({
    cfg: { nome: lsGet("dassh-nome", ""), baud: 9600, tema: lsGet("dassh-tema", "dassh"), conversa: "", limpar_apos: true },
    cofre: [], portas: [], teste: "",
    clientes: { clientes: ["Sessão compartilhada"], atual: "Sessão compartilhada", raiz: "Navegador" },
    evid: { ok: true, visita_nome: "Acompanhamento ao vivo", visita: "", proximo: 0, cliente_nome: "Sessão compartilhada", dados: {} },
  }),
  portas: async () => [],
  evid_status: async () => ({ ok: true, visita_nome: "Acompanhamento ao vivo", visita: "", proximo: 0, cliente_nome: "Sessão compartilhada", dados: {} }),
  fila_status: async () => ({ pendentes: 0, falhas: [], itens: [] }),
  wa_status: async () => ({ ok: false, estado: "fechado" }),
  salvar_pref: async (k, v) => { if (k === "nome") lsSet("dassh-nome", v); if (k === "tema") lsSet("dassh-tema", v); return { ok: true }; },
  conectar: async (sid, tipo, _p, _b, codigo) => {
    if (tipo !== "remoto") return SO_NO_APP;
    const cod = (codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cod.length !== 12) return { ok: false, erro: "Código inválido: são 12 caracteres (ex.: ABCD-EFGH-JKLM)." };
    const c = new Convidado(sid, cod, (window.NOME_WEB || lsGet("dassh-nome", "Convidado")).slice(0, 40));
    try { await c.iniciar(); } catch (e) { return { ok: false, erro: e.message }; }
    sessoes.set(sid, c);
    return { ok: true, alvo: cod, nome: "Remoto " + cod.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3") };
  },
  escrever: async (sid, txt) => { const c = sessoes.get(sid); if (c && c.controle) c.enviar({ t: "in", d: txt }); return { ok: true }; },
  share_pedir: async (sid) => { sessoes.get(sid)?.enviar({ t: "pedir" }); return { ok: true }; },
  share_devolver: async (sid) => { sessoes.get(sid)?.enviar({ t: "devolver" }); return { ok: true }; },
  desconectar: async (sid) => { const c = sessoes.get(sid); if (c) { await c.fechar(true); sessoes.delete(sid); } return { ok: true }; },
};
window.pywebview = { api: new Proxy(api, { get: (t, k) => t[k] || (async () => SO_NO_APP) }) };
addEventListener("beforeunload", () => sessoes.forEach((c) => c.fechar(true)));

// sobe o app e já abre a entrada pelo código (do #código na URL ou digitado)
window.dispatchEvent(new Event("pywebviewready"));
document.body.classList.add("web");
// --- fonte do terminal no navegador: ajusta só quando o ESPAÇO muda (sem laço de medir -> mudar -> medir) ---
let _tam = "";
window.ajustarFonte = () => {
  const box = document.getElementById("terminal"); if (!box || !box.clientWidth) return;
  const W = box.clientWidth - 30, H = box.clientHeight - 26, chave = W + "x" + H;
  if (chave === _tam) return; _tam = chave;
  abas.forEach((a) => {
    const c = medirCelula({ options: { ...a.term.options, fontSize: 100 } });   // célula a 100 px: proporção estável
    const alvo = Math.floor(Math.min(W / (a.term.cols * c.width / 100), H / (a.term.rows * c.height / 100)) * 2) / 2;
    a.term.options.fontSize = Math.max(9, Math.min(17, alvo));
  });
};

// --- portão de vidro fosco: o app só aparece depois que quem compartilhou APROVA a entrada ---
const vidro = document.getElementById("vidro"), $v = (s) => vidro.querySelector(s);
const msgV = (t, erro) => { $v("#v-msg").textContent = t || ""; $v("#v-msg").classList.toggle("erro", !!erro); };
let abaRemota = null;
const onShareApp = window.onShare, onDescApp = window.onDesconectado;
window.onShare = (sid, t, d) => {
  onShareApp(sid, t, d);
  if (t === "aprovado") vidro.classList.add("aberto");
};
window.onDesconectado = (sid, motivo) => {
  onDescApp(sid, motivo);
  if (abaRemota && sid === abaRemota.id) {
    abaRemota = null; vidro.classList.remove("aberto"); $v("#v-btn").disabled = false;
    msgV(/recusou/.test(motivo) ? "Quem compartilhou recusou a entrada." :
         /não respondeu/.test(motivo) ? "Sem resposta: confira o código ou peça a quem compartilhou para aprovar." : motivo, true);
  }
};
$v("#v-cod").value = decodeURIComponent(location.hash.slice(1) || "");
$v("#v-nome").value = lsGet("dassh-nome", "");
addEventListener("hashchange", () => { if (!abaRemota) $v("#v-cod").value = decodeURIComponent(location.hash.slice(1)); });
$v("form").onsubmit = async (e) => {
  e.preventDefault();
  const nome = $v("#v-nome").value.trim().slice(0, 40), cod = $v("#v-cod").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!nome) return msgV("Informe o seu nome.", true);
  if (cod.length !== 12) return msgV("O código tem 12 caracteres (ex.: ABCD-EFGH-JKLM).", true);
  $v("#v-btn").disabled = true; msgV("Conectando com segurança…");
  lsSet("dassh-nome", nome); lsSet("dassh_nome_ok", "1"); NOME = nome;
  for (const id of [...abas.keys()]) if (!abas.get(id).conectado) fecharAba(id);   // tira a aba de boas-vindas
  abaRemota = await entrarSessao(cod);
  if (!abaRemota) { $v("#v-btn").disabled = false; return msgV("Não foi possível conectar. Verifique a internet.", true); }
  if (!abaRemota.conectado) { const r = abaRemota; abaRemota = null; fecharAba(r.id); $v("#v-btn").disabled = false; return msgV("Não foi possível entrar com esse código.", true); }
  msgV("🔐 Pedido enviado. Aguardando quem compartilhou aprovar a sua entrada…");
};
// tudo que não é do shell compartilhado fica travado (só olhar)
let tAviso;
document.addEventListener("click", (e) => {
  if (!e.target.closest(".topo, .lateral, #nova-aba, #btn-compartilhar, #btn-historico, .aba .rec")) return;
  e.stopPropagation(); e.preventDefault();
  const el = document.getElementById("aviso-web"); el.classList.add("on");
  clearTimeout(tAviso); tAviso = setTimeout(() => el.classList.remove("on"), 2400);
}, true);
