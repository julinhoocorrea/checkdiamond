# 📧 CONFIGURAÇÃO DE EMAILS - Agência Check

## 🎯 **PROBLEMA ATUAL:**
Os emails de credenciais para revendedores não estão sendo enviados porque o sistema estava apenas **simulando** o envio.

## ✅ **SOLUÇÃO IMPLEMENTADA:**
Sistema de email com **múltiplas estratégias** de envio:

---

## 🚀 **OPÇÕES DE CONFIGURAÇÃO:**

### **1. EmailJS (Recomendado) ⭐**
**Grátis até 200 emails/mês**

1. **Crie conta:** https://emailjs.com
2. **Configure serviço:**
   - Conecte Gmail, Outlook, ou outro provedor
   - Ou use serviço SMTP customizado
3. **Crie template:**
   - Template ID: `template_credenciais`
   - Variáveis: `{{to_email}}`, `{{subject}}`, `{{html_content}}`
4. **Configure variáveis:**
   ```env
   VITE_EMAILJS_SERVICE_ID=service_abc123
   VITE_EMAILJS_TEMPLATE_ID=template_def456
   VITE_EMAILJS_PUBLIC_KEY=user_ghi789
   ```

### **2. Webhook Personalizado**
**Para integração com backend próprio**

1. **Configure webhook** que recebe POST:
   ```json
   {
     "to": "email@exemplo.com",
     "subject": "Assunto",
     "html": "<html>...</html>",
     "text": "Texto...",
     "source": "agencia-check"
   }
   ```
2. **Configure URL:**
   ```env
   VITE_EMAIL_WEBHOOK_URL=https://seu-backend.com/send-email
   ```

### **3. Desenvolvimento Local**
**Funciona automaticamente** - abre cliente de email local (Outlook, Mail, etc.)

---

## 🔧 **COMO CONFIGURAR EMAILJS (PASSO A PASSO):**

### **Passo 1: Criar Conta**
- Acesse: https://emailjs.com
- Crie conta gratuita

### **Passo 2: Adicionar Serviço Email**
- **Dashboard** → **Email Services** → **Add New Service**
- Escolha: **Gmail**, **Outlook**, ou **Custom SMTP**
- Conecte sua conta de email

### **Passo 3: Criar Template**
- **Dashboard** → **Email Templates** → **Create New Template**
- **Template Name:** `Credenciais Revendedor`
- **Template ID:** `template_credenciais` (anotar)

**Conteúdo do Template:**
```html
Assunto: {{subject}}

Para: {{to_email}}
De: {{from_name}}

{{html_content}}

---
Texto alternativo:
{{text_content}}
```

### **Passo 4: Obter Credenciais**
- **Dashboard** → **Integration**
- Copie:
  - **Service ID**
  - **Template ID**
  - **Public Key**

### **Passo 5: Configurar no Netlify**
- **Netlify** → **Site Settings** → **Environment Variables**
- Adicione:
  ```
  VITE_EMAILJS_SERVICE_ID = seu_service_id
  VITE_EMAILJS_TEMPLATE_ID = seu_template_id
  VITE_EMAILJS_PUBLIC_KEY = sua_public_key
  ```

### **Passo 6: Redeploy**
- **Netlify** → **Deploys** → **Trigger Deploy**

---

## 🧪 **COMO TESTAR:**

### **1. Teste de Desenvolvimento**
Sem configuração, o sistema:
- Abre cliente de email local (mailto)
- Copia conteúdo para clipboard
- Mostra preview do email

### **2. Teste com EmailJS**
Com EmailJS configurado:
- Email é enviado automaticamente
- Confirmação no console
- Preview disponível na interface

### **3. Verificar Console**
- **F12** → **Console**
- Busque por: `📧 Email enviado` ou `❌ Erro`

---

## 📋 **STATUS ATUAL:**

**✅ FUNCIONANDO AGORA:**
- ✅ Geração de credenciais automática
- ✅ Templates de email profissionais
- ✅ Sistema multi-estratégia
- ✅ Fallback para desenvolvimento
- ✅ Preview do email na interface
- ✅ Log detalhado para debugging

**⚙️ CONFIGURE PARA PRODUÇÃO:**
- Configure EmailJS para envio automático
- Ou configure webhook personalizado
- Ou use fallback manual (mailto)

---

## 🎯 **RESULTADO ESPERADO:**

Após configurar EmailJS:
1. **Cadastrar revendedor** → Sistema gera senha
2. **Email enviado automaticamente** para o revendedor
3. **Confirmação** na interface: "Email enviado com sucesso"
4. **Revendedor recebe email** com credenciais e instruções

---

## 🆘 **TROUBLESHOOTING:**

### **Email não chega:**
- Verificar spam/lixeira
- Conferir email digitado
- Verificar configuração EmailJS
- Checar console do navegador

### **Erro "EmailJS não configurado":**
- Verificar variáveis de ambiente no Netlify
- Redeploy após adicionar variáveis
- Confirmar Service ID, Template ID, Public Key

### **Fallback ativo:**
- Sistema abre cliente de email local
- Copia conteúdo para clipboard
- Envio manual necessário

---

**📧 AGORA OS EMAILS DE CREDENCIAIS FUNCIONAM CORRETAMENTE!**
