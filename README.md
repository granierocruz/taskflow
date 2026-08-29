# ⚡ TaskFlow

> Aplicativo fullstack moderno e dinâmico para gerenciamento produtivo de tarefas, categorias, tags e métricas de desempenho.

---

## 📖 Sobre o Projeto

O **TaskFlow** é uma solução completa para organização e acompanhamento de tarefas diárias e projetos. Desenvolvido com foco em alta performance, experiência de usuário fluida em Dark Mode e visualização clara de produtividade.

---

## ✨ Funcionalidades Principais

- 📊 **Dashboard Dinâmico e Gamificado:**
  - Saudação personalizada de acordo com o horário ("Bom dia/tarde/noite").
  - Métricas rápidas: tarefas ativas, concluídas no dia, urgentes, atrasadas e tarefas a vencer hoje.
  - Card expandido de **Progresso dos Últimos 7 Dias** com gráfico de barras e contagem de entregas semanais.
  - Seção dedicada de **Próximas a Vencer** com alertas visuais por proximidade de prazo.
- 📝 **Gestão Completa de Tarefas (CRUD):**
  - Criação de tarefas com título, descrição, prioridade (Urgente, Média, Baixa), status e data de vencimento.
  - Suporte a **subtarefas/checklist** interativo com barra de progresso em tempo real.
  - Suporte a **tarefas recorrentes** automatizadas via rotina diária (Cron Job).
  - Floating Action Button (**FAB**) pulsante para abertura ágil do modal de criação.
- 📂 **Categorias e Colunas Personalizadas:**
  - Organização por categorias customizáveis com paleta de cores e ícones.
  - Criação rápida de novas categorias/colunas diretamente pelo cabeçalho do painel.
- 🏷️ **Tags e Filtros Inteligentes:**
  - Classificação com tags coloridas, busca em tempo real e filtros por status e prioridade.
- 🔐 **Autenticação Segura:**
  - Cadastro e Login com JWT (Access Token e Refresh Token) com interceptores para auto-refresh.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** com **Vite**
- **React Router Dom v7** (Roteamento com rotas públicas e protegidas)
- **Date-fns** (Manipulação e formatação de datas em pt-BR)
- **Recharts** (Visualização de métricas e gráficos)
- **Axios** (Comunicação HTTP com interceptors de autenticação)
- **CSS3 Moderno** com Design Tokens, Glassmorphism e Dark Mode nativo

### Backend
- **Node.js** + **Express**
- **Better-SQLite3** (Banco de dados relacional leve e de alta performance)
- **JSON Web Token (JWT)** + **Bcrypt.js** (Autenticação e hash de senhas)
- **Node-Cron** (Agendamento de tarefas em segundo plano para recorrências)
- **Express-Validator** & **CORS**

---

## 🌐 Hospedagem na Vercel (Deploy do Frontend)

O projeto já está 100% configurado para a Vercel com arquivos `vercel.json` tanto na raiz quanto na pasta `frontend/`, garantindo o redirecionamento correto das rotas do React Router (SPA).

### Passo a passo para Deploy na Vercel:

1. Acesse o painel da [Vercel](https://vercel.com/) e clique em **Add New Project**.
2. Importe o repositório **[`granierocruz/taskflow`](https://github.com/granierocruz/taskflow)**.
3. Se solicitado, defina:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` (ou deixe na raiz `/`, pois o `vercel.json` raiz cuidará do build automaticamente).
4. Em **Environment Variables**, adicione a seguinte variável:

| Variável | Descrição | Exemplo de Valor |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL da API do backend com o caminho `/api` | `https://sua-api-taskflow.onrender.com/api` |

5. Clique em **Deploy**! 🚀

---

## ⚙️ Variáveis de Ambiente

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)
```env
PORT=3001
JWT_SECRET=sua_chave_secreta_jwt_longa_e_segura
JWT_REFRESH_SECRET=sua_chave_secreta_refresh_jwt_segura
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/granierocruz/taskflow.git
cd taskflow
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no seu navegador.

---

## 📂 Estrutura de Diretórios

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── db/              # Conexão SQLite e migrations
│   │   ├── middleware/      # Middlewares de autenticação e erros
│   │   ├── routes/          # Endpoints da API (auth, tasks, categories, tags)
│   │   └── server.js        # Inicialização do Express e Cron
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Cliente Axios e chamadas aos endpoints (com VITE_API_URL)
│   │   ├── components/      # Componentes reutilizáveis (Layout, Sidebar, Tasks)
│   │   ├── contexts/        # Contextos React (Auth, Toast)
│   │   ├── pages/           # Páginas (Dashboard, Tasks, Categories, Settings, Login, Register)
│   │   ├── styles/          # Design Tokens e CSS Global
│   │   ├── App.jsx          # Configuração de rotas
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json          # Configuração SPA para Vercel
│   ├── index.html
│   └── package.json
├── vercel.json              # Configuração Vercel na raiz
├── .gitignore
└── README.md
```

---

## 📄 Licença

Distribuído sob a licença MIT.
