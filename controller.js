const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function register(req, res) {
  // validasi email
  if (!req.body.email) {
    return res.status(400).send({ message: 'email diperlukan' });
  }
  // validasi password
  if (!req.body.password) {
    return res.status(400).send({ message: 'password diperlukan' });
  }
  const { email, password } = req.body;

  try {
    // hash password
    const hashPassword = await bcrypt.hash(password, 5);
    // tambah user nya masukan ke db
    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword,
      },
    });
    return res.status(201).send({ message: 'user berhasil dibuat' });
  } catch (error) {
    res.status(500).send({ massege: 'Internal Server Error' });
  }
}
async function login(req, res) {
  // validasi email
  if (!req.body.email) {
    return res.status(400).send({ message: 'Email diperlukan' });
  }
  // validasi password
  if (!req.body.password) {
    return res.status(400).send({ message: 'Password diperlukan' });
  }

  const { email, password } = req.body;

  try {
    // cari user dengan email yang diberikan
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // jika user tidak ditemukan
    if (!user) {
      return res.status(401).send({ message: 'Email atau password salah' });
    }

    // bandingkan password yang dihash dengan yang disimpan di database
    const passwordMatch = await bcrypt.compare(password, user.password);

    // jika password tidak cocok
    if (!passwordMatch) {
      return res.status(401).send({ message: 'Email atau password salah' });
    }

    // jika email dan password cocok, buat JWT token
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, 'rahasia', { expiresIn: '1h' });

    return res.status(200).send({ accessToken: accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
}

async function getAllBooks(req, res) {
  // read all book table
  try {
    const books = await prisma.book.findMany();
    res.send(books);
  } catch (error) {
    res.status(500).send({ massage: 'Internal server error' });
  }
}

async function createBook(req, res) {
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
}

async function deleteBookById(req, res) {
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
}
module.exports = { getAllBooks, createBook, deleteBookById, register, login };
