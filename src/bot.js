const { Client, RemoteAuth, LocalAuth } = require("whatsapp-web.js");
const { PostgresStore } = require("wwebjs-postgres");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function criarCliente() {
  const isLinux = process.platform === "linux";

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

  const puppeteerOptions = {
    headless: true,
    args: puppeteerArgs,
  };

  if (isLinux) {
    // Chrome instalado dentro do projeto pelo postinstall (persiste no Render)
    const cacheDir = path.join(process.cwd(), ".puppeteer-cache");

    function encontrarChrome(dir) {
      if (!fs.existsSync(dir)) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = encontrarChrome(fullPath);
          if (found) return found;
        } else if (entry.name === "chrome" && entry.isFile()) {
          return fullPath;
        }
      }
      return null;
    }

    const caminhoChrome = encontrarChrome(cacheDir);

    if (!caminhoChrome) {
      console.error("❌ Chrome não encontrado em:", cacheDir);
      console.error(
        "Conteúdo do diretório:",
        fs.existsSync(cacheDir) ? fs.readdirSync(cacheDir) : "pasta não existe",
      );
      process.exit(1);
    }

    console.log("🌐 Chrome em:", caminhoChrome);
    puppeteerOptions.executablePath = caminhoChrome;
  }

  const client = new Client({
    authStrategy: authStrategy,
    puppeteer: puppeteerOptions,
  });

  client.on("remote_session_saved", () => {
    console.log("💾 Sessão salva no Supabase com sucesso!");
  });

  client.on("ready", () => {
    console.log("✅ Bot conectado e escutando as mensagens!");
  });

client.on("qr", (qr) => {
    console.log("==== QR CODE ABAIXO ====");
    const qrcode = require("qrcode-terminal");
    qrcode.generate(qr, { small: true });
    console.log("==== QR CODE ACIMA ====");
    console.log("📱 Escaneie o QR Code acima com o WhatsApp!");
});

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
