# Plann.er Monorepo ✈️

Um projeto completo de planejamento de viagens com API REST e Frontend Web, unificados em um **Monorepo** moderno utilizando **npm Workspaces** e **Turborepo** para alta performance e portfólio profissional.

---

## 🏗️ Estrutura do Monorepo

O projeto está organizado na seguinte estrutura de workspaces:

```text
planner.trip/
├── apps/
│   ├── web/        # Frontend React (Vite, TailwindCSS, Axios)
│   └── api/        # REST API Node.js (Fastify, Prisma ORM, Zod)
├── package.json    # Configurações globais do monorepo e scripts
├── turbo.json      # Pipeline do Turborepo para builds e execução paralela
└── README.md       # Documentação principal
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend (`apps/web`)
- **React** (v18) & **TypeScript**
- **Vite** (Build tool rápida e leve)
- **TailwindCSS** & **Tailwind Variants**
- **Axios** (Integração HTTP com o Backend)
- **Lucide React** (Ícones modernos)
- **Date-fns** & **React Day Picker** (Manipulação de datas)

### Backend (`apps/api`)
- **Node.js** & **TypeScript**
- **Fastify** (Framework HTTP de altíssima performance)
- **Prisma ORM** (Banco de dados relacional com SQLite/PostgreSQL)
- **Zod** (Validação de schemas e tipagens em runtime)
- **Nodemailer** (Disparo de emails mock para confirmação de participantes)

### Ferramental do Monorepo
- **npm Workspaces**: Resolução de dependências otimizada em um único `node_modules/` raiz.
- **Turborepo**: Caching de builds, pipelines inteligentes e execução em paralelo das aplicações de forma ágil.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- **Node.js** (LTS recomendado, v18+)
- **npm** (v9+)

### Passo 1: Instalação de Dependências
Instale todas as dependências de todas as aplicações com um único comando na raiz do projeto:
```bash
npm install
```

### Passo 2: Configurando o Banco de Dados (API)
Navegue até a pasta da API ou execute o generator do Prisma:
```bash
npm run prisma:generate
```

Caso precise rodar as migrations do banco de dados (SQLite local padrão):
```bash
npm run prisma:migrate
```

### Passo 3: Executando o Projeto em Desenvolvimento
Inicie o Frontend e a API em paralelo usando o Turborepo:
```bash
npm run dev
```
O console centralizará as saídas do Fastify (API) e do Vite (Frontend Web) de forma organizada.

---

## 📦 Scripts Disponíveis no Root

- `npm run dev`: Executa ambos os projetos em paralelo em modo desenvolvimento.
- `npm run build`: Faz a build de produção de todos os workspaces em paralelo.
- `npm run lint`: Executa a verificação estática de código e estilos.
- `npm run prisma:generate`: Gera os clientes Prisma necessários para as rotas da API.
- `npm run prisma:migrate`: Aplica as migrations do banco de dados local.
