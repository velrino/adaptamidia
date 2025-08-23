# Claude Code - Projeto Admin XMP Media

## 🏗️ Estrutura do Projeto

### Tecnologias Principais
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **NextAuth.js** para autenticação
- **React Context** para gerenciamento de estado

### Estrutura de Pastas
```
src/
├── app/(admin)/          # Páginas do admin (App Router)
├── backend/api/          # Endpoints da API
├── components/           # Componentes reutilizáveis
├── context/             # Contexts (Loading, Toast, Sidebar, User)
├── hooks/               # Custom hooks
├── interfaces/          # Types TypeScript
├── layout/              # Componentes de layout
└── utils/               # Utilitários
```

## 🔧 Padrões e Convenções

### Context Pattern
- **UserContext**: Gerencia dados do usuário e verificação de permissões
- **ToastContext**: Notificações
- **LoadingContext**: Estados de loading
- **SidebarContext**: Estado da sidebar

### Hooks Personalizados
- **useCache**: Cache localStorage genérico
- **useUserSession**: Sessão do usuário com cache (5min padrão)
- **useUser**: Acesso aos dados do usuário e permissões

### Sistema de Permissões
```typescript
const { hasPermission, hasAnyPermission, hasAllPermissions } = useUser();

// Verificar uma permissão
if (hasPermission("SUDO")) { /* ... */ }

// Verificar múltiplas permissões
if (hasAnyPermission(["ADMIN", "EDITOR"])) { /* ... */ }
```

### Cache Strategy
- **localStorage** para persistir dados entre refreshes
- **5 minutos** de duração padrão
- Cache automático da API `API.user.me`

### API Structure
```typescript
// Resposta da API.user.me
{
  "token": { "id": "...", "iat": 123, "exp": 456, "expires_in": "..." },
  "user": {
    "_id": "...",
    "email": "admin@example.com", 
    "permissions": ["SUDO", "ADMIN"],
    "companies": [],
    // ...
  }
}
```

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção  
npm run lint         # Executar linter
npm run typecheck    # Verificar tipos TypeScript
```

### Testing
> ⚠️ Verificar README para comandos de teste específicos

## 📋 Checklist para Novos Recursos

- [ ] Seguir convenções de nomenclatura existentes
- [ ] Usar contexts existentes (User, Toast, Loading)
- [ ] Implementar verificação de permissões quando necessário
- [ ] Usar custom hooks quando aplicável
- [ ] Executar `npm run lint` e `npm run typecheck`
- [ ] Testar funcionalidade antes de finalizar

## 🔐 Sistema de Autenticação

- **NextAuth.js** com sessões customizadas
- Token de acesso em `session.api_session.access_token`
- Cache automático dos dados do usuário
- Permissões baseadas em array de strings

## 💡 Notas Importantes

- **Não committar** automaticamente sem permissão explícita
- **Sempre verificar** permissões antes de exibir componentes sensíveis
- **Usar cache** para evitar requisições desnecessárias
- **Seguir padrões** de componentes existentes
- **Manter código** limpo e bem tipado