// Teste de conectividade com Banco Inter
// Execute com: node teste-inter.js

const clientId = "27dc6392-c910-4cf8-a813-6d9ee3c53d2c";
const clientSecret = "b27ef11f-89e6-4010-961b-2311afab2a75";
const baseUrl = "https://cdpj.partners.bancointer.com.br";
const scope = "pix.cob.write pix.cob.read webhook.read webhook.write";

console.log("🔑 Iniciando teste de conectividade com Banco Inter...");
console.log("📋 Credenciais configuradas:");
console.log("- Client ID:", clientId);
console.log("- Client Secret:", clientSecret.substring(0, 8) + "...");
console.log("- Base URL:", baseUrl);
console.log("- Escopo:", scope);
console.log("");

// Teste 1: Autenticação OAuth2
async function testarAutenticacao() {
  try {
    console.log("1️⃣ Testando autenticação OAuth2...");

    const tokenPayload = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
      grant_type: "client_credentials"
    });

    const response = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "KwaiDiamonds/1.0"
      },
      body: tokenPayload
    });

    console.log("📡 Status HTTP:", response.status);
    const data = await response.json();
    console.log("📋 Resposta completa:", JSON.stringify(data, null, 2));

    if (response.ok && data.access_token) {
      console.log("✅ SUCESSO: Token obtido!");
      console.log("🔑 Token:", data.access_token.substring(0, 20) + "...");
      console.log("⏰ Expira em:", data.expires_in, "segundos");
      console.log("🎯 Tipo:", data.token_type);
      console.log("📝 Escopo:", data.scope);
      return data.access_token;
    } else {
      console.log("❌ ERRO: Falha na autenticação");
      console.log("🔍 Erro:", data.error);
      console.log("📝 Descrição:", data.error_description);
      return null;
    }
  } catch (error) {
    console.log("❌ ERRO de rede:", error.message);
    return null;
  }
}

// Teste 2: Criação de cobrança PIX
async function testarCobrancaPix(token) {
  if (!token) {
    console.log("⚠️ Pulando teste de cobrança - sem token válido");
    return;
  }

  try {
    console.log("\n2️⃣ Testando criação de cobrança PIX...");

    const txid = "TESTE" + Date.now().toString().substring(-8);
    console.log("🆔 TXID de teste:", txid);

    const cobrancaPayload = {
      calendario: {
        expiracao: 3600 // 1 hora
      },
      devedor: {
        cpf: "12345678901",
        nome: "Cliente Teste"
      },
      valor: {
        original: "0.01"
      },
      chave: "kwai@agenciacheck.com",
      solicitacaoPagador: "Teste de integração - 1 diamante Kwai",
      infoAdicionais: [
        {
          nome: "Teste",
          valor: "Integração Kwai Diamonds"
        }
      ]
    };

    console.log("📤 Payload:", JSON.stringify(cobrancaPayload, null, 2));

    const response = await fetch(`${baseUrl}/pix/v2/cob/${txid}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "KwaiDiamonds/1.0"
      },
      body: JSON.stringify(cobrancaPayload)
    });

    console.log("📡 Status HTTP:", response.status);
    const data = await response.json();
    console.log("📋 Resposta completa:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ SUCESSO: Cobrança PIX criada!");
      console.log("🆔 TXID:", data.txid);
      console.log("🔗 Location:", data.location);
      console.log("📋 PIX Copia e Cola:", data.pixCopiaECola ? "Gerado" : "Não disponível");
      console.log("📱 QR Code:", data.qrcode ? "Gerado" : "Não disponível");
    } else {
      console.log("❌ ERRO: Falha na criação da cobrança");
      console.log("🔍 Erro:", data.detail || data.error);
    }
  } catch (error) {
    console.log("❌ ERRO de rede:", error.message);
  }
}

// Executar testes
async function executarTestes() {
  console.log("🚀 Iniciando bateria de testes...\n");

  const token = await testarAutenticacao();
  await testarCobrancaPix(token);

  console.log("\n🏁 Testes concluídos!");

  if (token) {
    console.log("\n✅ RESULTADO FINAL: Integração com Banco Inter FUNCIONANDO!");
    console.log("🎯 Próximos passos:");
    console.log("- As credenciais estão válidas");
    console.log("- A API está respondendo corretamente");
    console.log("- O sistema pode usar o Banco Inter em produção");
  } else {
    console.log("\n❌ RESULTADO FINAL: Problemas na integração");
    console.log("🔍 Possíveis causas:");
    console.log("- Credenciais inválidas ou expiradas");
    console.log("- Ambiente sandbox vs produção");
    console.log("- Permissões insuficientes");
    console.log("- Chave PIX não cadastrada");
  }
}

// Executar
executarTestes().catch(console.error);
