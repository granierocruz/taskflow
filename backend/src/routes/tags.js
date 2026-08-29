const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tags
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const tags = db.prepare(`
      SELECT tg.*, COUNT(tt.task_id) as task_count
      FROM tags tg
      LEFT JOIN task_tags tt ON tg.id = tt.tag_id
      WHERE tg.user_id = ?
      GROUP BY tg.id
      ORDER BY tg.name
    `).all(req.userId);
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

// POST /api/tags
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Nome obrigatório.')],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const db = getDb();
      const { name, color } = req.body;
      const result = db.prepare(
        'INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)'
      ).run(req.userId, name, color || '#06d6a0');

      res.status(201).json(db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/tags/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { name, color } = req.body;
    const info = db.prepare(
      'UPDATE tags SET name=?, color=? WHERE id=? AND user_id=?'
    ).run(name, color, req.params.id, req.userId);

    if (info.changes === 0) return res.status(404).json({ error: 'Tag não encontrada.' });
    res.json(db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tags/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const info = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Tag não encontrada.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
