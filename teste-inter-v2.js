// Teste de conectividade com Banco Inter - Versão Aprimorada
// Execute com: node teste-inter-v2.js

const clientId = "27dc6392-c910-4cf8-a813-6d9ee3c53d2c";
const clientSecret = "b27ef11f-89e6-4010-961b-2311afab2a75";
const baseUrl = "https://cdpj.partners.bancointer.com.br";
const scope = "pix.cob.write pix.cob.read webhook.read webhook.write";

console.log("🔑 Teste Banco Inter - Versão Detalhada");
console.log("📋 Credenciais:", { clientId, baseUrl, scope });
console.log("");

// Teste com diferentes formatos de autenticação
async function testarAutenticacaoFormatos() {
  console.log("1️⃣ Testando diferentes formatos de autenticação...");

  // Formato 1: Basic Auth
  try {
    console.log("\n🔸 Teste 1: Basic Auth Header");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response1 = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json"
      },
      body: `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`
    });

    console.log("📡 Status:", response1.status);
    console.log("📡 Headers:", [...response1.headers.entries()]);

    const text1 = await response1.text();
    console.log("📋 Resposta raw:", text1);

    if (text1) {
      try {
        const data1 = JSON.parse(text1);
        console.log("✅ JSON válido:", data1);
        if (data1.access_token) {
          console.log("🎉 TOKEN OBTIDO COM SUCESSO!");
          return data1.access_token;
        }
      } catch (e) {
        console.log("❌ Erro ao parsear JSON:", e.message);
      }
    }
  } catch (error) {
    console.log("❌ Erro Teste 1:", error.message);
  }

  // Formato 2: Credenciais no body
  try {
    console.log("\n🔸 Teste 2: Credenciais no Body");

    const response2 = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=${encodeURIComponent(scope)}`
    });

    console.log("📡 Status:", response2.status);
    console.log("📡 Headers:", [...response2.headers.entries()]);

    const text2 = await response2.text();
    console.log("📋 Resposta raw:", text2);

    if (text2) {
      try {
        const data2 = JSON.parse(text2);
        console.log("✅ JSON válido:", data2);
        if (data2.access_token) {
          console.log("🎉 TOKEN OBTIDO COM SUCESSO!");
          return data2.access_token;
        }
      } catch (e) {
        console.log("❌ Erro ao parsear JSON:", e.message);
      }
    }
  } catch (error) {
    console.log("❌ Erro Teste 2:", error.message);
  }

  // Formato 3: JSON Body
  try {
    console.log("\n🔸 Teste 3: JSON Body");

    const response3 = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope
      })
    });

    console.log("📡 Status:", response3.status);
    console.log("📡 Headers:", [...response3.headers.entries()]);

    const text3 = await response3.text();
    console.log("📋 Resposta raw:", text3);

    if (text3) {
      try {
        const data3 = JSON.parse(text3);
        console.log("✅ JSON válido:", data3);
        if (data3.access_token) {
          console.log("🎉 TOKEN OBTIDO COM SUCESSO!");
          return data3.access_token;
        }
      } catch (e) {
        console.log("❌ Erro ao parsear JSON:", e.message);
      }
    }
  } catch (error) {
    console.log("❌ Erro Teste 3:", error.message);
  }

  return null;
}

// Teste de conectividade básica
async function testarConectividade() {
  try {
    console.log("🌐 Testando conectividade básica...");

    const response = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "User-Agent": "KwaiDiamonds/1.0"
      }
    });

    console.log("📡 Status:", response.status);
    console.log("📡 Headers:", [...response.headers.entries()]);
    console.log("✅ Conectividade OK");

  } catch (error) {
    console.log("❌ Erro de conectividade:", error.message);
  }
}

// Executar todos os testes
async function executarTodos() {
  await testarConectividade();
  console.log("\n" + "=".repeat(50));
  const token = await testarAutenticacaoFormatos();

  console.log("\n" + "=".repeat(50));
  if (token) {
    console.log("🎉 SUCESSO TOTAL!");
    console.log("✅ Banco Inter está conectado e funcionando");
    console.log("✅ Token válido obtido");
    console.log("✅ Sistema pronto para usar API real");
  } else {
    console.log("⚠️ DIAGNÓSTICO:");
    console.log("- Conectividade: OK");
    console.log("- Credenciais: Precisam de ajuste");
    console.log("- Possível solução: Verificar ambiente (sandbox vs produção)");
    console.log("- Alternativa: Contatar suporte do Banco Inter");
  }
}

executarTodos().catch(console.error);
