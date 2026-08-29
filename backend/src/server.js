require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { runMigrations } = require('./db/migrations');
const { getDb } = require('./db/database');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const categoryRoutes = require('./routes/categories');
const tagRoutes = require('./routes/tags');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.FRONTEND_URL && process.env.FRONTEND_URL !== '*' 
  ? process.env.FRONTEND_URL 
  : true;

// Middlewares globais
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Cron job: todo dia à meia-noite, cria novas instâncias de tarefas recorrentes diárias
cron.schedule('0 0 * * *', () => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    const recurringTasks = db.prepare(
      `SELECT * FROM tasks WHERE is_recurring = 1 AND recurrence = 'daily' AND status = 'done'`
    ).all();

    const insertTask = db.prepare(`
      INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date, is_recurring, recurrence)
      VALUES (?, ?, ?, ?, ?, 'todo', ?, 1, 'daily')
    `);

    recurringTasks.forEach(task => {
      insertTask.run(task.user_id, task.category_id, task.title, task.description, task.priority, today);
    });

    console.log(`🔁 Cron: ${recurringTasks.length} tarefas recorrentes criadas para ${today}`);
  } catch (err) {
    console.error('Cron error:', err);
  }
});

// Inicializar
runMigrations();
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API rodando na porta ${PORT}`);
});
