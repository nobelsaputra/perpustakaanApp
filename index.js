const express = require('express');
const app = express();
const port = 3000;

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

app.use(express.json());

// Menampilkan semua buku
app.get('/books', async (req, res) => {
  // read all book table
  try {
    const books = await prisma.book.findMany();
    res.send(books);
  } catch (error) {
    res.status(500).send({ massage: 'Internal server error' });
  }
});

// Menambahkan buku baru
app.post('/books/menambah', async (req, res) => {
  try {
    // Mengambil data buku dari body permintaan
    const { judul, halaman, author } = req.body;

    // Menambahkan buku ke database menggunakan Prisma Client
    const newBook = await prisma.book.create({
      data: {
        judul,
        halaman,
        author,
      },
    });

    // Memberikan respons bahwa buku telah berhasil ditambahkan
    res.status(201).send({ message: 'Buku berhasil ditambahkan', book: newBook });
  } catch (error) {
    // Menangani kesalahan yang mungkin terjadi saat menambahkan buku
    console.error('Error adding book:', error);
    res.status(500).send({ message: 'Gagal menambahkan books' });
  }
});

// Mengakses buku berdasarkan id nya
app.get('/book/:id', async (req, res) => {
  try {
    const { id } = req.params; // Ambil ID buku dari URL
    const book = await prisma.book.findUnique({
      where: {
        id: parseInt(id), // Konversi ID menjadi tipe data yang sesuai (biasanya integer)
      },
    });

    if (!book) {
      // Jika buku tidak ditemukan, kirim respons 404
      return res.status(404).send({ message: 'Buku tidak ditemukan' });
    }

    // Jika buku ditemukan, kirim respons dengan detail buku
    res.send(book);
  } catch (error) {
    // Tangani kesalahan yang mungkin terjadi
    console.error('Error fetching book:', error);
    res.status(500).send({ message: 'Gagal mengambil detail buku' });
  }
});

// Menghapus buku berdasarkan judul
// Menghapus buku berdasarkan ID
app.delete('/book/:id', async (req, res) => {
  try {
    const { id } = req.params; // Ambil ID buku dari URL

    // Menghapus buku dari database menggunakan Prisma Client
    const deletedBook = await prisma.book.delete({
      where: {
        id: parseInt(id), // Konversi ID menjadi tipe data yang sesuai (biasanya integer)
      },
    });

    // Memberikan respons bahwa buku telah berhasil dihapus
    res.send({ message: 'Buku berhasil dihapus', book: deletedBook });
  } catch (error) {
    // Menangani kesalahan yang mungkin terjadi saat menghapus buku
    console.error('Error deleting book:', error);
    res.status(500).send({ message: 'Gagal menghapus buku' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
