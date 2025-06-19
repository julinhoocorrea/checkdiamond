# 🚀 Agência Check - Sistema de Gestão de Revendedores

Sistema completo de gestão para revendedores com compatibilidade total com **Safari** e todos os navegadores modernos.

## ✨ Funcionalidades Principais

- 🔐 **Autenticação Segura**: Login com diferentes níveis de acesso
- 📊 **Dashboard Avançado**: Métricas em tempo real e gráficos interativos
- 👥 **Gestão de Revendedores**: Cadastro e controle completo
- 💰 **Pagamentos PIX**: Integração com Banco Inter e 4send
- 📦 **Controle de Estoque**: Gestão completa de produtos
- 📈 **Relatórios DRE**: Análises financeiras detalhadas
- 🤖 **IA Ana**: Assistente virtual inteligente
- 📱 **100% Responsivo**: Interface adaptada para todos os dispositivos

## 🍎 Compatibilidade Garantida

- ✅ **Safari** (macOS/iOS 11+)
- ✅ **Chrome/Chromium** (todas as versões)
- ✅ **Firefox** (todas as versões)
- ✅ **Edge** (todas as versões)

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI/UX**: shadcn/ui + Tailwind CSS + Framer Motion
- **Estado**: Zustand + React Hook Form
- **Validação**: Zod
- **Gráficos**: Recharts
- **Icons**: Lucide React
- **Build**: Vite com target ES2015
- **Polyfills**: core-js/stable para máxima compatibilidade

## 🚀 Deploy no Netlify

### Configuração Automática (Recomendado)
1. **Acesse**: https://app.netlify.com/
2. **Conecte**: repositório `julinhoocorrea/checkdiamond`
3. **Configure**:
   - **Branch**: `main`
   - **Build command**: `bun run build`
   - **Publish directory**: `dist`
4. **Deploy**: Automático a cada push

### Deploy Manual
```bash
# 1. Build do projeto
bun run build

# 2. Deploy direto no Netlify
# Arraste a pasta 'dist' para netlify.com/drop
```

## 🔑 Credenciais de Teste

### 👨‍💼 Admin (Acesso Total)
- **Email**: `juliocorrea@check2.com.br`
- **Senha**: `Ju113007?`

### 👤 Revendedor (Acesso Limitado)
- **Email**: `joao@revendedor.com`
- **Senha**: `123456`

## ⚡ Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/julinhoocorrea/checkdiamond.git
cd checkdiamond

# Instale dependências
bun install

# Execute em desenvolvimento
bun run dev

# Build para produção
bun run build
```

## 🏗️ Arquivos de Configuração

### `netlify.toml` (Deploy)
```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `vite.config.ts` (Build)
```typescript
export default defineConfig({
  build: {
    target: ['es2015', 'safari11'],
    cssTarget: ['chrome61', 'firefox60', 'safari11', 'edge18']
  }
})
```

## 🔧 Melhorias de Compatibilidade

### Safari Específico
- ✅ Polyfills para `crypto.randomUUID`
- ✅ Fallbacks para `ResizeObserver`
- ✅ Prefixos CSS `-webkit-`
- ✅ Meta tags iOS específicas
- ✅ Font rendering otimizado

### Performance
- ✅ Chunk splitting automático
- ✅ Lazy loading implementado
- ✅ Assets minificados
- ✅ Tree shaking ativo

## 📱 Funcionalidades Detalhadas

### 📊 Dashboard
- Métricas de receita, lucro e vendas
- Gráficos interativos por período
- Indicadores de performance
- Status de revendedores ativos

### 💰 Sistema PIX
- Geração de cobranças instantâneas
- QR codes automáticos
- Múltiplos provedores (Inter/4send)
- Webhooks para confirmação

### 📈 Relatórios
- DRE completo com impostos
- Análise de comissões
- Exportação para Excel
- Filtros por período

## 🌐 URLs Importantes

- **Produção**: https://checkdiamond.netlify.app
- **Repositório**: https://github.com/julinhoocorrea/checkdiamond
- **Netlify Admin**: https://app.netlify.com/

## 📞 Suporte

- 📧 **Email**: suporte@agenciacheck.com.br
- 💬 **WhatsApp**: (11) 99999-9999
- 📱 **Telegram**: @agenciacheck

---

**🎯 Sistema 100% testado e compatível com todos os navegadores!**
