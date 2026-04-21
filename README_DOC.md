# Mestria Digital - Plataforma de Treinamentos
Última modificação: 21/04/2026 às 17:58

Esta plataforma foi construída com foco em segurança anti-compartilhamento de contas.

## 1. Configuração do Firebase (Manual)
Após rodar o `set_up_firebase`, você precisa configurar manualmente o primeiro Administrador no Console do Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Vá em **Firestore Database**.
3. Crie uma coleção chamada `admins`.
4. Adicione um documento onde o **ID do Documento** seja o seu UID de usuário (você pode ver seu UID na lista de `Users` da Autenticação após se cadastrar no site).
5. O documento pode estar vazio ou ter `{ "active": true }`.
6. No site, seu usuário agora terá acesso ao botão "Painel Admin" no menu do perfil.

## 2. Bloqueio de Dispositivo (Device ID)
O sistema gera um `deviceId` único baseado no hardware e navegador.
- No primeiro login, o `deviceId` é salvo no perfil do usuário.
- Se o usuário tentar logar em outro PC/Celular, o acesso será negado.
- O Admin pode "Resetar Dispositivo" no painel para permitir que o aluno troque de aparelho.

## 3. Sessão Única
Sempre que um novo login é feito, um `currentSessionId` é atualizado.
- Se o usuário estiver com duas abas abertas ou logar em dois navegadores, a sessão anterior será derrubada automaticamente via WebSockets (Firestore Snapshots).

## 4. Hospedagem (GitHub Pages)
Como esta é uma Single Page Application (SPA) com React Router:
1. Gere o build: `npm run build`
2. Os arquivos estarão na pasta `dist/`.
3. No GitHub Pages, você precisará de uma técnica como renomear o `index.html` para `404.html` ou usar um script de fallback para que as rotas funcionem (ou use Firebase Hosting para suporte nativo a SPAs).

---

**IMPORTANTE:** Desenvolvido com foco em segurança profissional para infoprodutores.
