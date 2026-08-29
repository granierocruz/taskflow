const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tasks/stats — dados para o dashboard
router.get('/stats', (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const today = new Date().toISOString().slice(0, 10);

    const totalActive = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status != 'done' AND is_archived = 0`
    ).get(userId).count;

    const completedToday = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'done' AND date(completed_at) = ?`
    ).get(userId, today).count;

    const urgent = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND priority = 'high' AND status != 'done' AND is_archived = 0`
    ).get(userId).count;

    const overdue = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date < ? AND status != 'done' AND is_archived = 0`
    ).get(userId, today).count;

    const dueToday = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND date(due_date) = ? AND status != 'done' AND is_archived = 0`
    ).get(userId, today).count;

    // Streak: contar dias consecutivos com ao menos 1 tarefa concluída
    const completedDays = db.prepare(
      `SELECT DISTINCT date(completed_at) as day FROM tasks WHERE user_id = ? AND status = 'done' ORDER BY day DESC`
    ).all(userId).map(r => r.day);

    let streak = 0;
    let current = new Date();
    for (const day of completedDays) {
      const check = current.toISOString().slice(0, 10);
      if (day === check) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    // Progresso semanal (últimos 7 dias)
    const weekProgress = db.prepare(`
      SELECT date(completed_at) as day, COUNT(*) as count
      FROM tasks
      WHERE user_id = ? AND status = 'done' AND completed_at >= date('now', '-6 days')
      GROUP BY date(completed_at)
    `).all(userId);

    res.json({ totalActive, completedToday, urgent, overdue, dueToday, streak, weekProgress });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { status, priority, category_id, tag_id, search, archived } = req.query;

    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
        (SELECT COUNT(*) FROM task_items WHERE task_id = t.id) as items_total,
        (SELECT COUNT(*) FROM task_items WHERE task_id = t.id AND is_completed = 1) as items_done
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }
    if (search) { sql += ' AND t.title LIKE ?'; params.push(`%${search}%`); }
    sql += ` AND t.is_archived = ${archived === 'true' ? 1 : 0}`;
    sql += ' ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC';

    let tasks = db.prepare(sql).all(...params);

    // Filtrar por tag
    if (tag_id) {
      const tagged = db.prepare(
        'SELECT task_id FROM task_tags WHERE tag_id = ?'
      ).all(tag_id).map(r => r.task_id);
      tasks = tasks.filter(t => tagged.includes(t.id));
    }

    // Enriquecer com tags e subtarefas
    const getTagsStmt = db.prepare(`
      SELECT tg.* FROM tags tg
      JOIN task_tags tt ON tg.id = tt.tag_id
      WHERE tt.task_id = ?
    `);
    const getItemsStmt = db.prepare(
      'SELECT * FROM task_items WHERE task_id = ? ORDER BY sort_order'
    );

    tasks = tasks.map(t => ({
      ...t,
      tags: getTagsStmt.all(t.id),
      items: getItemsStmt.all(t.id),
    }));

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });

    task.tags = db.prepare(`SELECT tg.* FROM tags tg JOIN task_tags tt ON tg.id = tt.tag_id WHERE tt.task_id = ?`).all(task.id);
    task.items = db.prepare('SELECT * FROM task_items WHERE task_id = ? ORDER BY sort_order').all(task.id);

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Título obrigatório.'),
    body('priority').isIn(['high', 'medium', 'low']).optional(),
    body('status').isIn(['todo', 'in_progress', 'done']).optional(),
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const db = getDb();
      const { title, description, priority, status, due_date, category_id, is_recurring, recurrence, tags, items } = req.body;

      const result = db.prepare(`
        INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date, is_recurring, recurrence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.userId, category_id || null, title, description || null, priority || 'medium', status || 'todo', due_date || null, is_recurring ? 1 : 0, recurrence || null);

      const taskId = result.lastInsertRowid;

      // Inserir tags
      if (tags && tags.length > 0) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)');
        tags.forEach(tagId => insertTag.run(taskId, tagId));
      }

      // Inserir subtarefas
      if (items && items.length > 0) {
        const insertItem = db.prepare('INSERT INTO task_items (task_id, title, sort_order) VALUES (?, ?, ?)');
        items.forEach((item, i) => insertItem.run(taskId, item.title, i));
      }

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      task.tags = db.prepare(`SELECT tg.* FROM tags tg JOIN task_tags tt ON tg.id = tt.tag_id WHERE tt.task_id = ?`).all(taskId);
      task.items = db.prepare('SELECT * FROM task_items WHERE task_id = ? ORDER BY sort_order').all(taskId);

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/tasks/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });

    const { title, description, priority, status, due_date, category_id, is_recurring, recurrence, tags } = req.body;
    const completed_at = status === 'done' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE tasks SET title=?, description=?, priority=?, status=?, due_date=?, category_id=?,
        is_recurring=?, recurrence=?, completed_at=?, updated_at=datetime('now')
      WHERE id=?
    `).run(title, description || null, priority || 'medium', status || 'todo', due_date || null,
      category_id || null, is_recurring ? 1 : 0, recurrence || null, completed_at, req.params.id);

    // Atualizar tags
    if (tags !== undefined) {
      db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(req.params.id);
      if (tags.length > 0) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)');
        tags.forEach(tagId => insertTag.run(req.params.id, tagId));
      }
    }

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    updated.tags = db.prepare(`SELECT tg.* FROM tags tg JOIN task_tags tt ON tg.id = tt.tag_id WHERE tt.task_id = ?`).all(req.params.id);
    updated.items = db.prepare('SELECT * FROM task_items WHERE task_id = ? ORDER BY sort_order').all(req.params.id);

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', (req, res, next) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });

    const isDone = task.status === 'done';
    db.prepare(`
      UPDATE tasks SET status=?, completed_at=?, updated_at=datetime('now') WHERE id=?
    `).run(isDone ? 'todo' : 'done', isDone ? null : new Date().toISOString(), req.params.id);

    res.json({ success: true, status: isDone ? 'todo' : 'done' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const info = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Tarefa não encontrada.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/items — criar subtarefa
router.post('/:id/items', [body('title').trim().notEmpty()], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDb();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });

    const count = db.prepare('SELECT COUNT(*) as c FROM task_items WHERE task_id = ?').get(req.params.id).c;
    const result = db.prepare('INSERT INTO task_items (task_id, title, sort_order) VALUES (?, ?, ?)').run(req.params.id, req.body.title, count);
    res.status(201).json(db.prepare('SELECT * FROM task_items WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/items/:itemId — toggle subtarefa
router.patch('/:id/items/:itemId', (req, res, next) => {
  try {
    const db = getDb();
    const item = db.prepare('SELECT * FROM task_items WHERE id = ? AND task_id = ?').get(req.params.itemId, req.params.id);
    if (!item) return res.status(404).json({ error: 'Subtarefa não encontrada.' });

    db.prepare('UPDATE task_items SET is_completed = ? WHERE id = ?').run(item.is_completed ? 0 : 1, item.id);
    res.json({ success: true, is_completed: !item.is_completed });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id/items/:itemId
router.delete('/:id/items/:itemId', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM task_items WHERE id = ? AND task_id = ?').run(req.params.itemId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
