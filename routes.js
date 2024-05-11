const express = require('express');
const { getAllBooks, createBook, deleteBookById, register, login } = require('./controller');
const route = express.Router();

route.get('/books', getAllBooks);
route.post('/books/menambah', createBook);
route.delete('/books/:id', deleteBookById);

route.post('/register', register);
route.post('/login', login);

module.exports = route;
