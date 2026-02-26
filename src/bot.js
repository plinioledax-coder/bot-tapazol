const { Client, RemoteAuth, LocalAuth } = require("whatsapp-web.js");
const { PostgresStore } = require("wwebjs-postgres");
const { Pool } = require("pg");

async function criarCliente() {
  const isLinux = process.platform === "linux";

  // No Windows, usamos LocalAuth (salva sessão em arquivo local, sem bugs de arquivo bloqueado)
  // No Linux/Render, usamos RemoteAuth com Supabase (o sistema de arquivos é efêmero lá)
  let authStrategy;

  if (isLinux) {
    console.log("🐧 Linux detectado → usando RemoteAuth (Supabase)");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const store = new PostgresStore({ pool: pool });
    authStrategy = new RemoteAuth({
      clientId: "bot-tapazol",
      store: store,
      backupSyncIntervalMs: 300000,
    });
  } else {
    console.log("🪟 Windows detectado → usando LocalAuth (arquivo local)");
    authStrategy = new LocalAuth({ clientId: "bot-tapazol" });
  }

  const puppeteerArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--disable-gpu",
  ];

  if (isLinux) {
    puppeteerArgs.push("--no-zygote");
    puppeteerArgs.push("--single-process");
  }

  const client = new Client({
    authStrategy: authStrategy,
    puppeteer: {
      headless: true,
      args: puppeteerArgs,
    },
  });

  client.on("remote_session_saved", () => {
    console.log("💾 Sessão salva no Supabase com sucesso!");
  });

  client.on("ready", () => {
    console.log("✅ Bot conectado e escutando as mensagens!");
  });

  client.on("qr", (qr) => {
    const qrcode = require("qrcode-terminal");
    qrcode.generate(qr, { small: true });
    console.log("📱 Escaneie o QR Code acima com o WhatsApp!");
  });

  // Lógica das mensagens (Tapazol)
  client.on("message_create", async (msg) => {
    const numeroAlvo = process.env.NUMERO_NAMORADA.replace("@c.us", "");

    if (msg.from.includes(numeroAlvo) && !msg.fromMe) {
      const texto = msg.body.toLowerCase();

      if (
        texto.includes("tomei") ||
        texto.includes("já") ||
        texto.includes("sim")
      ) {
        await msg.reply("Boa! ❤️ Fico mais tranquilo.");
      } else if (
        texto.includes("agora não") ||
        texto.includes("espera") ||
        texto.includes("adiar") ||
        texto.includes("daqui a pouco")
      ) {
        await msg.reply("Ok, te lembro do Tapazol de novo em 15 minutos! ⏱️");

        setTimeout(
          async () => {
            try {
              await client.sendMessage(
                msg.from,
                'Ei, passaram os 15 minutos! 💊 Já tomou o Tapazol agora? (Responda "tomei" para eu parar de encher o saco 😂)',
              );
            } catch (error) {
              console.error("❌ Erro ao enviar a cobrança:", error);
            }
          },
          15 * 60 * 1000,
        );
      }
    }
  });

  return client;
}

module.exports = criarCliente;