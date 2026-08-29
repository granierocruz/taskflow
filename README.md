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

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Git](https://git-scm.com/)

---

### 1. Clonar o Repositório

```bash
git clone https://github.com/granierocruz/taskflow.git
cd taskflow
```

---

### 2. Configurar e Executar o Backend

```bash
cd backend
npm install

# Copie o arquivo de exemplo de ambiente
cp .env.example .env

# Inicie o servidor da API (porta padrão: 3001)
npm run dev
```

---

### 3. Configurar e Executar o Frontend

Em um novo terminal:

```bash
cd frontend
npm install

# Inicie a aplicação React (porta padrão: 5173)
npm run dev
```

Abra seu navegador em [http://localhost:5173](http://localhost:5173) e aproveite o TaskFlow!

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
│   │   ├── api/             # Cliente Axios e chamadas aos endpoints
│   │   ├── components/      # Componentes reutilizáveis (Layout, Sidebar, Tasks)
│   │   ├── contexts/        # Contextos React (Auth, Toast)
│   │   ├── pages/           # Páginas (Dashboard, Tasks, Categories, Settings, Login, Register)
│   │   ├── styles/          # Design Tokens e CSS Global
│   │   ├── App.jsx          # Configuração de rotas
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📄 Licença

Este projeto é desenvolvido para fins educacionais e profissionais. Distribuído sob a licença MIT.
