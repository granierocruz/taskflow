const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/categories
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*, COUNT(t.id) as task_count
      FROM categories c
      LEFT JOIN tasks t ON t.category_id = c.id AND t.is_archived = 0 AND t.status != 'done'
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.name
    `).all(req.userId);
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Nome obrigatório.'),
    body('color').optional().isHexColor(),
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const db = getDb();
      const { name, color, icon } = req.body;
      const result = db.prepare(
        'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)'
      ).run(req.userId, name, color || '#6366f1', icon || '📁');

      res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/categories/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { name, color, icon } = req.body;
    const info = db.prepare(
      'UPDATE categories SET name=?, color=?, icon=? WHERE id=? AND user_id=?'
    ).run(name, color, icon, req.params.id, req.userId);

    if (info.changes === 0) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const info = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
