<div align="center">

# ⭐ Palpite Perfeito

### O bolão completo para a Copa do Mundo 2026!!

*Faça seus palpites, dispute com amigos e comprove quem manda nas previsões!*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📋 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack técnica](#-stack-técnica)
- [Pontuação](#-sistema-de-pontuação)
- [Pré-requisitos](#-pré-requisitos)
- [Como rodar](#-como-rodar)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Banco de dados](#-banco-de-dados)
- [Backup automático](#-backup-automático)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Painel Administrativo](#-painel-administrativo)

---

## 🎯 Sobre o projeto

**Palpite Perfeito** é uma aplicação web de bolão esportivo construída com Next.js 16, focada na Copa do Mundo 2026. Cada participante palpita nos placares das partidas, aposta no artilheiro e no campeão — acumulando pontos conforme a precisão das previsões. Também existe um seed de teste para Brasileirão 2026, útil para validar rodada e fluxo de apostas com jogos reais de teste.

### ✨ Destaques

- ⚡ **Tempo real** — pontos atualizados assim que o admin lança resultados
- 🔒 **Apostas únicas protegidas** — prazo valida 10 min antes de cada jogo (fuso SP)
- 📱 **Responsivo** — header adaptativo com ícones em telas menores, textos em telas largas
- 🛡️ **Segurança** — NextAuth + bcrypt + validação dupla (client + server action)

---

## 🚀 Funcionalidades

### Para participantes
| Funcionalidade | Descrição |
|---|---|
| 🏟️ **Palpites de partidas** | Aposte no placar antes de cada jogo (fecha 10 min antes) |
| 🥇 **Artilheiro da Copa** | Aposta única — nome do jogador + total de gols |
| 🏆 **Campeão & Final** | Aposta única — campeão, vice e placar da grande final |
| 📊 **Ranking ao vivo** | Classificação geral com todos os participantes |
| 📋 **Meus Palpites** | Histórico de palpites com pontos ganhos por jogo |
| ❓ **Como Funciona** | Página de ajuda com exemplos e tabela de pontuação |

### Para administradores
| Funcionalidade | Descrição |
|---|---|
| ✅ **Lançar resultados** | Insere placar + gols de cada partida e recalcula pontos |
| ⚽ **Gerenciar partidas** | CRUD completo: criar, editar, excluir partidas |
| 👥 **Gerenciar usuários** | CRUD de participantes com controle de roles |
| 🏅 **Definir artilheiro** | Define o artilheiro oficial e recalcula as apostas |
| 🥇 **Definir campeão** | Define campeão/vice/placar da final e recalcula |
| ♻️ **Resetar base** | Limpa palpites, gols, apostas especiais, resultados e pontos, preservando as partidas |

### Deploy sem indisponibilidade

O projeto já está preparado para rodar em Docker com `output: 'standalone'` e deploy blue-green.

- A aplicação passa a subir dentro de um container Node minimalista.
- Um proxy Nginx fica na frente da aplicação e recebe o tráfego do Cloudflare Tunnel.
- O deploy sobe o slot novo, roda as migrations, espera o healthcheck e só depois troca o upstream.
- Isso evita a janela clássica de indisponibilidade de `npm start` + restart manual.

---

## 🛠️ Stack técnica

| Camada | Tecnologia |
|---|---|
| **Framework** | [Next.js 16.2](https://nextjs.org) com Turbopack + React Compiler |
| **Linguagem** | TypeScript 5 |
| **Autenticação** | [NextAuth v5](https://authjs.dev) — JWT + Credentials |
| **ORM** | [Prisma 6](https://prisma.io) |
| **Banco** | SQLite (via `prisma/dev.db`) |
| **Estilização** | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| **Componentes** | Radix UI, Lucide Icons, Sonner (toasts) |
| **Datas/Fuso** | `date-fns` + `date-fns-tz` (America/Sao_Paulo) |
| **Senhas** | `bcryptjs` |

---

## 🏆 Sistema de Pontuação

### Palpites de Partidas

| Situação | Pontos |
|---|:---:|
| 🎯 Placar exato | **25** |
| 🥈 Vencedor + diferença de gols corretos | **18** |
| 🥉 Apenas vencedor (ou empate) correto | **10** |
| ❌ Erro total | **0** |

### Apostas Especiais

| Situação | Pontos |
|---|:---:|
| 🎯 Artilheiro: nome + gols corretos | **35** |
| 🎖️ Artilheiro: apenas nome correto | **20** |
| 🥇 Final: campeão + placar + vice corretos | **90** |
| 🥈 Final: campeão + placar corretos | **70** |
| 🥉 Final: apenas campeão correto | **50** |

> **Nota:** As apostas especiais fecham **10 minutos antes do primeiro jogo** e são **únicas** (não podem ser alteradas após salvas).

---

## 📦 Pré-requisitos

- **Node.js** ≥ 20
- **npm** ≥ 10
- **sqlite3** (linha de comando — para o script de backup)

---

## ▶️ Como rodar

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/palpite-perfeito-next.git
cd palpite-perfeito-next
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com seus valores (veja seção abaixo)
```

### 3. Criar e popular o banco

```bash
npx prisma migrate dev        # Executa as migrations
npm run prisma:seed           # Popula com dados iniciais (opcional)
```

### 3.1 Seed de teste do Brasileirão

Se quiser subir uma base menor para teste com a rodada 10 do Brasileirão 2026, use o seed dedicado:

```bash
npm run prisma:seed:brasileirao-test
```

Esse modo cria usuários de teste e os jogos da rodada 10 exibidos no GE, para validar rapidamente o fluxo do app sem carregar toda a Copa.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
# Acesse http://localhost:3000
```

### 5. Build para produção

```bash
npm run build
npm run start
```

### 6. Rodar com Docker

```bash
docker compose -f docker-compose.prod.yml up -d proxy app-blue
```

Antes disso, defina pelo menos:

```env
APP_IMAGE=ghcr.io/seu-usuario/palpite-perfeito-next:latest
DATABASE_URL=file:/data/palpite.db
AUTH_SECRET=um_secret_forte
NEXTAUTH_URL=https://seu-dominio
```

O Cloudflare Tunnel deve apontar para o proxy local, não para o app diretamente.

### 6.1 Rodar localmente em container

Se a ideia for apenas subir na sua máquina pessoal, use este fluxo mais simples:

```bash
AUTH_SECRET=um_secret_forte ./scripts/run-local-container.sh
```

Ou diretamente:

```bash
AUTH_SECRET=um_secret_forte docker compose -f docker-compose.local.yml up -d --build
```

Esse compose sobe o container `app`, aplica `prisma migrate deploy` e publica a aplicação em `http://localhost:3000` por padrão. Se a porta já estiver ocupada na máquina em que você estiver, defina `LOCAL_PORT` antes de subir.

### 7. Deploy blue-green

Depois de publicar a imagem no registry, o workflow de deploy usa as `GitHub Variables` e `GitHub Secrets` do repositório:

- `NEXTAUTH_URL` em Variables, com a URL pública do seu ambiente
- `ADMIN_PASS` em Secrets, com a senha do administrador criada pelo seed
- `AUTH_SECRET` em Secrets, com o segredo do NextAuth

Depois disso, o deploy roda automaticamente. Se quiser executar manualmente no servidor:

```bash
APP_IMAGE=ghcr.io/seu-usuario/palpite-perfeito-next:latest \
AUTH_SECRET=seu_secret \
./scripts/deploy-blue-green.sh
```

O script alterna entre `app-blue` e `app-green`, aplica migrations, valida o healthcheck e troca o upstream do proxy sem derrubar o site.

O painel admin tem botões de seed para a Copa e para a base de teste do Brasileirão:

- `Seed Copa` recria a base da Copa do Mundo.
- `Seed Teste` recria a base de teste do Brasileirão.

O usuário admin é recriado automaticamente no deploy com a senha vinda de `ADMIN_PASS`.

---

## 🔑 Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL="file:./prisma/dev.db"

# NextAuth — gere um secret com: openssl rand -base64 32
AUTH_SECRET="seu_secret_aqui"

# URL base da aplicação
NEXTAUTH_URL="http://localhost:3000"
```

> ⚠️ **Nunca** versione o arquivo `.env` com valores reais. O arquivo já está no `.gitignore`.

---

## 🗄️ Banco de dados

O projeto usa **SQLite** com **Prisma ORM**. Os arquivos ficam em `prisma/`.

### Comandos úteis

```bash
# Criar/aplicar migrations
npx prisma migrate dev --name nome_da_migration

# Abrir o Prisma Studio (interface visual)
npx prisma studio

# Regenerar o client após alterar o schema
npx prisma generate

# Reset completo (⚠️ apaga todos os dados)
npx prisma migrate reset --force

# Seed de teste do Brasileirão 2026 (rodada 10)
npm run prisma:seed:brasileirao-test
```

### Modelos principais

```
User           → participantes (role: USER | ADMIN)
Match          → partidas (status: PENDING | FINISHED)
Goal           → gols de uma partida (player, team, minute)
Guess          → palpite de partida por usuário
TopScorerBet   → aposta no artilheiro (única por usuário)
ChampionBet    → aposta no campeão/vice/final (única por usuário)
TournamentResult → resultado oficial (artilheiro e campeão)
```

## ♻️ Reset administrativo

No painel admin existe um botão de reset para reiniciar a competição antes de uma nova rodada ou evento.

- Mantém as partidas cadastradas.
- Remove gols, palpites, apostas especiais, resultados e login attempts.
- Zera os pontos de todos os usuários.
- Exige confirmação manual no painel para evitar limpeza acidental.

O helper compartilhado do reset também é usado pelo seed, mas no seed completo a limpeza inclui as partidas para recriar a base do zero.

---

## 💾 Backup automático

O projeto inclui um script shell que realiza backup do banco SQLite **duas vezes por dia (08:00 e 20:00)**, mantendo os **14 backups mais recentes** (~1 semana).

### Instalar o cron

```bash
# Instala a entrada no crontab do usuário atual
./scripts/install-cron.sh
```

### Executar manualmente

```bash
./scripts/backup-db.sh
```

Os arquivos são salvos em `backups/palpite_YYYYMMDD_HHMMSS.db` e estão no `.gitignore`.

### Verificar o cron

```bash
crontab -l
# Saída esperada:
# 0 8,20 * * * /path/scripts/backup-db.sh >> /var/log/palpite-backup.log 2>&1
```

---

## 📁 Estrutura do projeto

```
palpite-perfeito-next/
├── prisma/
│   ├── schema.prisma           # Modelos do banco
│   ├── seed.ts                 # Dados iniciais
│   └── migrations/             # Histórico de migrations
├── public/                     # Assets estáticos
├── scripts/
│   ├── backup-db.sh            # Script de backup
│   └── install-cron.sh         # Instala cron 2×/dia
├── backups/                    # Gerado automaticamente (no .gitignore)
└── src/
    ├── app/
    │   ├── (main)/
    │   │   ├── page.tsx            # 🏟️ Lista de jogos
    │   │   ├── ranking/            # 📊 Ranking geral
    │   │   ├── my-bets/            # 📋 Meus palpites
    │   │   ├── special-bets/       # ⭐ Apostas especiais
    │   │   ├── help/               # ❓ Como funciona
    │   │   └── admin/              # 🛡️ Painel admin
    │   ├── actions/
    │   │   ├── auth.ts             # Login / registro
    │   │   ├── guesses.ts          # Salvar palpites
    │   │   ├── admin.ts            # Ações administrativas
    │   │   └── special-bets.ts     # Apostas especiais
    │   └── api/auth/               # NextAuth route handler
    ├── components/
    │   ├── AdminPanel.tsx          # Dashboard admin (4 abas)
    │   ├── AppHeader.tsx           # Navbar responsivo
    │   ├── BetDialog.tsx           # Modal de palpite
    │   ├── GameCard.tsx            # Card de partida
    │   ├── GamesList.tsx           # Lista de partidas
    │   ├── SpecialBetsPanel.tsx    # Formulários de apostas especiais
    │   └── ui/                     # Componentes shadcn/ui
    └── lib/
        ├── auth.ts                 # Config NextAuth
        ├── game-logic.ts           # Regras do bolão
        ├── prisma.ts               # Client singleton
        ├── scoring.ts              # Re-export de scoring
        └── timezone.ts             # Formatação de datas (SP)
```

---

## 🛡️ Painel Administrativo

Acesse `/admin` com uma conta de role `ADMIN`. O painel tem 4 abas:

| Aba | Função |
|---|---|
| **Resultados** | Lança placar + gols; recalcula pontos automaticamente |
| **Partidas** | CRUD de partidas (grupos e eliminatórias) |
| **Torneio** | Define artilheiro e resultado da final |
| **Usuários** | CRUD de participantes; promoção para ADMIN |

---

<div align="center">

Feito com ☕ e muito amor ao futebol brasilero.

</div>
