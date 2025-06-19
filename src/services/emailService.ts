export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface RevendedorCredentials {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  permissions: string[];
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Gera uma senha temporária segura
   */
  generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';

    // Garantir pelo menos uma maiúscula, uma minúscula, um número e um caractere especial
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%'[Math.floor(Math.random() * 5)];

    // Adicionar mais 4 caracteres aleatórios
    for (let i = 0; i < 4; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Cria template de email para novas credenciais
   */
  createCredentialsTemplate(credentials: RevendedorCredentials): EmailTemplate {
    const permissionsList = credentials.permissions.join(', ');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo à Agência Check</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            padding: 30px;
          }
          .welcome {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
          }
          .credentials-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .credential-item:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-weight: 600;
            color: #495057;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #ffffff;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #ced4da;
            color: #495057;
          }
          .permissions {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .permissions h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .permission-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .permission-list li {
            padding: 3px 0;
            color: #424242;
          }
          .permission-list li:before {
            content: "✓ ";
            color: #4caf50;
            font-weight: bold;
          }
          .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .login-button:hover {
            transform: translateY(-2px);
            text-decoration: none;
            color: white;
          }
          .security-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💎 Agência Check</div>
            <h1>Bem-vindo à nossa plataforma!</h1>
          </div>

          <div class="content">
            <p class="welcome">
              Olá <strong>${credentials.name}</strong>!
            </p>

            <p>
              Você foi cadastrado como revendedor na plataforma <strong>Agência Check</strong>.
              Suas credenciais de acesso foram criadas e você já pode começar a usar o sistema.
            </p>

            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #495057;">🔐 Suas Credenciais de Acesso</h3>

              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${credentials.email}</span>
              </div>

              <div class="credential-item">
                <span class="credential-label">Senha:</span>
                <span class="credential-value">${credentials.password}</span>
              </div>

              <div class="credential-item">
                <span class="credential-label">URL de Acesso:</span>
                <span class="credential-value">${credentials.loginUrl}</span>
              </div>
            </div>

            <div class="permissions">
              <h3>🎯 Suas Permissões de Acesso</h3>
              <ul class="permission-list">
                ${credentials.permissions.map(permission => `<li>${permission}</li>`).join('')}
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${credentials.loginUrl}" class="login-button">
                🚀 Acessar Plataforma
              </a>
            </div>

            <div class="security-note">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Esta é uma senha temporária. Você será solicitado a alterá-la no primeiro acesso.</li>
                <li>Mantenha suas credenciais em segurança.</li>
                <li>Nunca compartilhe sua senha com terceiros.</li>
                <li>Em caso de dúvidas, entre em contato com o administrador.</li>
              </ul>
            </div>

            <p>
              Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.
            </p>

            <p>
              Bem-vindo à equipe! 🎉
            </p>
          </div>

          <div class="footer">
            <p>
              <strong>Agência Check - Plataforma de Diamantes Kwai</strong><br>
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bem-vindo à Agência Check!

Olá ${credentials.name}!

Você foi cadastrado como revendedor na plataforma Agência Check.

CREDENCIAIS DE ACESSO:
Email: ${credentials.email}
Senha: ${credentials.password}
URL: ${credentials.loginUrl}

SUAS PERMISSÕES:
${credentials.permissions.join('\n')}

IMPORTANTE:
- Esta é uma senha temporária
- Você deve alterá-la no primeiro acesso
- Mantenha suas credenciais em segurança

Acesse: ${credentials.loginUrl}

Bem-vindo à equipe!

---
Agência Check - Plataforma de Diamantes Kwai
Este é um email automático, por favor não responda.
    `;

    return {
      to: credentials.email,
      subject: '🎉 Bem-vindo à Agência Check - Suas credenciais de acesso',
      html,
      text
    };
  }

  /**
   * Envia email usando múltiplas estratégias
   */
  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; message: string; emailPreview?: string }> {
    try {
      // Estratégia 1: EmailJS (se configurado)
      const emailJSResult = await this.sendWithEmailJS(template);
      if (emailJSResult.success) {
        return emailJSResult;
      }

      // Estratégia 2: Mailto fallback para desenvolvimento
      const mailtoResult = await this.sendWithMailto(template);
      if (mailtoResult.success) {
        return mailtoResult;
      }

      // Estratégia 3: Webhook (se configurado)
      const webhookResult = await this.sendWithWebhook(template);
      if (webhookResult.success) {
        return webhookResult;
      }

      // Fallback: Log detalhado + interface para copiar
      return this.sendWithFallback(template);

    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        message: 'Erro ao enviar email. Verifique as configurações.'
      };
    }
  }

  /**
   * Envia email via EmailJS
   */
  private async sendWithEmailJS(template: EmailTemplate): Promise<{ success: boolean; message: string; emailPreview?: string }> {
    try {
      // Verifica se EmailJS está configurado
      const emailJSConfig = {
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
        templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
      };

      if (!emailJSConfig.serviceId || !emailJSConfig.templateId || !emailJSConfig.publicKey) {
        console.warn('EmailJS não configurado');
        return { success: false, message: 'EmailJS não configurado' };
      }

      // Importa EmailJS dinamicamente
      const emailjs = await import('@emailjs/browser');

      // Inicializa EmailJS
      emailjs.init(emailJSConfig.publicKey);

      // Envia email
      const result = await emailjs.send(
        emailJSConfig.serviceId,
        emailJSConfig.templateId,
        {
          to_email: template.to,
          subject: template.subject,
          html_content: template.html,
          text_content: template.text,
          from_name: 'Agência Check',
          reply_to: 'noreply@agenciacheck.com.br'
        }
      );

      console.log('✅ Email enviado via EmailJS:', result);

      return {
        success: true,
        message: `Email enviado com sucesso para ${template.to} via EmailJS`,
        emailPreview: template.html
      };

    } catch (error) {
      console.error('Erro EmailJS:', error);
      return { success: false, message: 'Erro no EmailJS' };
    }
  }

  /**
   * Envia email via Webhook
   */
  private async sendWithWebhook(template: EmailTemplate): Promise<{ success: boolean; message: string; emailPreview?: string }> {
    try {
      const webhookUrl = import.meta.env.VITE_EMAIL_WEBHOOK_URL;

      if (!webhookUrl) {
        return { success: false, message: 'Webhook não configurado' };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text,
          source: 'agencia-check'
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Email enviado com sucesso para ${template.to} via Webhook`,
          emailPreview: template.html
        };
      } else {
        throw new Error(`Webhook error: ${response.status}`);
      }

    } catch (error) {
      console.error('Erro Webhook:', error);
      return { success: false, message: 'Erro no Webhook' };
    }
  }

  /**
   * Abre cliente de email local (mailto)
   */
  private async sendWithMailto(template: EmailTemplate): Promise<{ success: boolean; message: string; emailPreview?: string }> {
    try {
      // Cria link mailto
      const subject = encodeURIComponent(template.subject);
      const body = encodeURIComponent(template.text);
      const mailtoLink = `mailto:${template.to}?subject=${subject}&body=${body}`;

      // Abre cliente de email
      window.open(mailtoLink, '_blank');

      return {
        success: true,
        message: `Cliente de email aberto para ${template.to}. Complete o envio no seu email.`,
        emailPreview: template.html
      };

    } catch (error) {
      console.error('Erro Mailto:', error);
      return { success: false, message: 'Erro ao abrir cliente de email' };
    }
  }

  /**
   * Fallback: Interface para copiar conteúdo
   */
  private async sendWithFallback(template: EmailTemplate): Promise<{ success: boolean; message: string; emailPreview?: string }> {
    // Log detalhado para debugging
    console.log('📧 EMAIL PARA ENVIO MANUAL:', {
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      timestamp: new Date().toISOString()
    });

    // Copia texto para clipboard se possível
    try {
      await navigator.clipboard.writeText(`
PARA: ${template.to}
ASSUNTO: ${template.subject}

${template.text}
      `);

      return {
        success: true,
        message: `Email copiado para clipboard. Cole no seu cliente de email e envie para ${template.to}`,
        emailPreview: template.html
      };
    } catch {
      return {
        success: true,
        message: `Email preparado para ${template.to}. Confira o console para detalhes e envie manualmente.`,
        emailPreview: template.html
      };
    }
  }

  /**
   * Envia credenciais para novo revendedor
   */
  async sendRevendedorCredentials(
    revendedor: { name: string; email: string },
    password: string,
    permissions: string[]
  ): Promise<{ success: boolean; message: string; password: string; emailPreview?: string }> {

    const credentials: RevendedorCredentials = {
      name: revendedor.name,
      email: revendedor.email,
      password,
      loginUrl: `${window.location.origin}/login`,
      permissions
    };

    const template = this.createCredentialsTemplate(credentials);
    const result = await this.sendEmail(template);

    return {
      success: result.success,
      message: result.message,
      password,
      emailPreview: result.emailPreview
    };
  }

  /**
   * Converte permissões em lista legível
   */
  formatPermissions(permissions: import('@/types').UserPermissions): string[] {
    const formatted: string[] = [];

    if (permissions.dashboard) {
      formatted.push('Dashboard - Visualizar métricas e relatórios');
    }

    if (permissions.vendas.view) {
      formatted.push('Vendas - Visualizar vendas');
    }
    if (permissions.vendas.create) {
      formatted.push('Vendas - Criar novas vendas');
    }
    if (permissions.vendas.edit) {
      formatted.push('Vendas - Editar vendas');
    }
    if (permissions.vendas.delete) {
      formatted.push('Vendas - Excluir vendas');
    }

    if (permissions.revendedores.view) {
      formatted.push('Revendedores - Visualizar lista');
    }
    if (permissions.revendedores.create) {
      formatted.push('Revendedores - Cadastrar novos');
    }

    if (permissions.estoque.view) {
      formatted.push('Estoque - Visualizar itens');
    }
    if (permissions.estoque.create) {
      formatted.push('Estoque - Adicionar itens');
    }

    if (permissions.pagamentos.view) {
      formatted.push('Pagamentos - Visualizar');
    }
    if (permissions.pagamentos.manage) {
      formatted.push('Pagamentos - Gerenciar');
    }

    if (permissions.envios.view) {
      formatted.push('Envios - Visualizar');
    }
    if (permissions.envios.manage) {
      formatted.push('Envios - Gerenciar entregas');
    }

    if (permissions.relatorios.view) {
      formatted.push('Relatórios - Visualizar');
    }
    if (permissions.relatorios.export) {
      formatted.push('Relatórios - Exportar dados');
    }

    if (permissions.configuracoes.view) {
      formatted.push('Configurações - Visualizar');
    }
    if (permissions.configuracoes.edit) {
      formatted.push('Configurações - Editar');
    }

    if (permissions.ia.view) {
      formatted.push('IA Ana - Visualizar');
    }
    if (permissions.ia.configure) {
      formatted.push('IA Ana - Configurar');
    }

    return formatted;
  }
}
