# Estrutura do Projeto (Atualizada)

Todos os nomes de arquivos e pastas foram atualizados para usar **lowercase com hífens** (kebab-case):

## Estrutura de Pastas

```
c:\Users\wasee\Desktop\management\
├── src/
│   ├── background/           # Service worker da extensão
│   │   └── background.ts
│   ├── components/           # Componentes React UI
│   │   ├── password-form.tsx
│   │   ├── password-list.tsx
│   │   └── side-panel.tsx
│   ├── services/            # Serviços de banco de dados
│   │   └── password-service.ts
│   ├── side-panel/          # Ponto de entrada do sidebar
│   │   └── main.tsx
│   ├── styles/              # Estilos CSS/Tailwind
│   │   └── tailwind.css
│   ├── types/               # Definições TypeScript
│   │   └── password.ts
│   └── rules/               # Regras CSP (mantido original)
│       └── rules_csp.json
├── github/                  # Instruções do Copilot
│   └── copilot-instructions.md
├── manifest.json            # Manifesto da extensão
├── sidepanel.html          # HTML do sidebar
├── package.json            # Dependências do projeto
├── vite.config.ts          # Configuração do Vite
├── tailwind.config.js      # Configuração do Tailwind
├── postcss.config.js       # Configuração do PostCSS
├── tsconfig*.json          # Configurações TypeScript
├── eslint.config.js        # Configuração ESLint
├── readme.md               # Documentação principal
└── install.md              # Guia de instalação
```

## Convenções de Nomenclatura

### ✅ Implementadas:
- **Pastas**: `kebab-case` (ex: `side-panel/`, `password-service/`)
- **Arquivos TypeScript/React**: `kebab-case.tsx` (ex: `password-form.tsx`, `side-panel.tsx`)
- **Arquivos de configuração**: `lowercase.extensão` (ex: `readme.md`, `install.md`)

### 📝 Mantidas como estavam:
- **Arquivos de configuração do projeto**: `camelCase.js` (ex: `vite.config.ts`, `tailwind.config.js`)
- **package.json e manifest.json**: mantidos no formato padrão
- **Arquivos gerados**: `tsconfig*.json`, `eslint.config.js`

## Mudanças Implementadas

1. **Renomeação de Pastas:**
   - `sidepanel/` → `side-panel/`
   - Outras pastas já estavam em lowercase: `components/`, `services/`, `types/`, `background/`, `styles/`

2. **Renomeação de Arquivos:**
   - `PasswordForm.tsx` → `password-form.tsx`
   - `PasswordList.tsx` → `password-list.tsx`
   - `SidePanel.tsx` → `side-panel.tsx` (recriado)
   - `passwordService.ts` → `password-service.ts`
   - `README.md` → `readme.md`
   - `INSTALL.md` → `install.md`

3. **Atualização de Imports:**
   - Todos os imports foram atualizados para refletir os novos caminhos
   - Verificação de consistência em todos os arquivos

## Verificação

✅ Build funcionando: `npm run build`  
✅ Estrutura consistente: todos os nomes em kebab-case  
✅ Imports atualizados: sem erros de referência  
✅ Funcionalidade mantida: extensão continua operacional  

A extensão agora segue uma convenção de nomenclatura consistente e moderna!
