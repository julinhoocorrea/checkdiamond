// Teste Banco Inter - Ambiente Sandbox
const clientId = "27dc6392-c910-4cf8-a813-6d9ee3c53d2c";
const clientSecret = "b27ef11f-89e6-4010-961b-2311afab2a75";
const sandboxUrl = "https://cdpj-sandbox.partners.bancointer.com.br";
const prodUrl = "https://cdpj.partners.bancointer.com.br";
const scope = "pix.cob.write pix.cob.read webhook.read webhook.write";

console.log("🧪 Teste Sandbox vs Produção - Banco Inter");
console.log("");

async function testarAmbiente(baseUrl, ambiente) {
  console.log(`🔍 Testando ${ambiente}: ${baseUrl}`);

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json"
      },
      body: `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`
    });

    console.log(`📡 Status ${ambiente}:`, response.status);

    const text = await response.text();
    console.log(`📋 Resposta ${ambiente}:`, text);

    if (response.ok && text) {
      try {
        const data = JSON.parse(text);
        if (data.access_token) {
          console.log(`🎉 SUCESSO ${ambiente.toUpperCase()}! Token obtido:`);
          console.log(`🔑 Token: ${data.access_token.substring(0, 20)}...`);
          console.log(`⏰ Expira em: ${data.expires_in}s`);
          return { success: true, token: data.access_token, data };
        }
      } catch (e) {
        console.log(`❌ Erro JSON ${ambiente}:`, e.message);
      }
    }

    return { success: false, status: response.status, response: text };

  } catch (error) {
    console.log(`❌ Erro ${ambiente}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function executarTestes() {
  console.log("🚀 Iniciando testes de ambiente...\n");

  // Teste Sandbox
  const resultSandbox = await testarAmbiente(sandboxUrl, "SANDBOX");
  console.log("\n" + "-".repeat(50) + "\n");

  // Teste Produção
  const resultProd = await testarAmbiente(prodUrl, "PRODUÇÃO");

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESULTADO FINAL:");
  console.log("=".repeat(50));

  if (resultSandbox.success) {
    console.log("✅ SANDBOX: Funcionando perfeitamente!");
    console.log("💡 Suas credenciais estão configuradas para SANDBOX");
    console.log("🎯 Para usar em produção, solicite credenciais de produção ao Banco Inter");
  } else if (resultProd.success) {
    console.log("✅ PRODUÇÃO: Funcionando perfeitamente!");
    console.log("💡 Suas credenciais estão configuradas para PRODUÇÃO");
    console.log("🎯 Sistema pronto para uso real!");
  } else {
    console.log("⚠️ Nenhum ambiente funcionou:");
    console.log("📋 Sandbox:", resultSandbox);
    console.log("📋 Produção:", resultProd);
    console.log("");
    console.log("🔍 Possíveis soluções:");
    console.log("1. Verificar se as credenciais estão ativas no portal");
    console.log("2. Confirmar se a integração foi aprovada");
    console.log("3. Verificar se o escopo está correto");
    console.log("4. Contatar suporte do Banco Inter");
  }
}

executarTestes().catch(console.error);
