const express = require('express');
const { getAllBooks, createBook, updateBookById, deleteBookById, register, login } = require('./controller');
const route = express.Router();

route.post('/register', register);
route.post('/login', login);

route.use((req, res, next) => {
  const authHeader = req.headers['token'];
  const token = authHeader;

  if (token == null) {
    return res.status(401).json({ error: 'Token tidak ada, akses ditolak' });
  }
  const verifryToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!verifryToken) {
    return res.status(403).json({ error: 'Token tidak valid' });
  } else {
    req.user = verifryToken;
    next();
  }
});

route.get('/books', getAllBooks);
route.post('/books/menambah', createBook);
route.post('/books/mengubah/:id', updateBookById);
route.delete('/books/:id', deleteBookById);

module.exports = route;
const jwt = require('jsonwebtoken');
