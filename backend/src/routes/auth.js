const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');

const router = express.Router();

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
    body('email').isEmail().withMessage('E-mail inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;
      const db = getDb();

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'E-mail já cadastrado.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = db.prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
      ).run(name, email, password_hash);

      // Criar categorias padrão para o novo usuário
      const defaultCategories = [
        { name: 'Trabalho', color: '#6366f1', icon: '💼' },
        { name: 'Casa', color: '#f59e0b', icon: '🏠' },
        { name: 'Estudos', color: '#06d6a0', icon: '📚' },
        { name: 'Pessoal', color: '#ec4899', icon: '✨' },
      ];
      const insertCat = db.prepare('INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)');
      defaultCategories.forEach(cat => insertCat.run(result.lastInsertRowid, cat.name, cat.color, cat.icon));

      const { accessToken, refreshToken } = generateTokens(result.lastInsertRowid);
      res.status(201).json({ accessToken, refreshToken, user: { id: result.lastInsertRowid, name, email } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('E-mail inválido.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const db = getDb();

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);
      res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token obrigatório.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
  }
});

module.exports = router;
