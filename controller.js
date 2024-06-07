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
  // Validasi email dan password
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({ message: 'Email dan password diperlukan' });
  }
  const { email, password } = req.body;
  try {
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(404).send({ message: 'Email atau password salah' });
    }
    // Bandingkan password yang di-hash dengan password yang dimasukkan
    const passwordMatch = await bcrypt.compare(password, user.password);
    // Jika password tidak cocok
    if (!passwordMatch) {
      return res.status(401).send({ message: 'Email atau password salah' });
    }
    // Generate JWT
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      // kita ubah disini
      expiresIn: '1h',
    }); // Menggunakan secretKey untuk signing token, disarankan menggunakan secret yang kuat dan disimpan di lingkungan yang aman.
    // Kirim accessToken sebagai respons
    return res.status(200).send({ accessToken });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
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
  const { userId } = req.user; // Pastikan req.user berisi userId yang valid
  try {
    // Mengambil data buku dari body permintaan
    const { judul, halaman, author, deskripsi, uploader } = req.body;

    // Validasi input, pastikan tidak ada properti yang undefined
    if (!judul || !halaman || !author || !deskripsi || !uploader) {
      return res.status(400).send({ message: 'Semua field harus diisi.' });
    }

    // Periksa apakah userId ada di tabel User
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(400).send({ message: 'User tidak ditemukan.' });
    }

    // Menambahkan buku ke database menggunakan Prisma Client
    const newBook = await prisma.book.create({
      data: {
        judul,
        halaman,
        author,
        deskripsi,
        uploader,
        userId,
      },
    });

    // Memberikan respons bahwa buku telah berhasil ditambahkan
    res.status(201).send({ message: 'Buku berhasil ditambahkan', book: newBook });
  } catch (error) {
    // Menangani kesalahan yang mungkin terjadi saat menambahkan buku
    console.error('Error adding book:', error);
    res.status(500).send({ message: 'Gagal menambahkan buku' });
  } finally {
    await prisma.$disconnect();
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

async function updateBookById(req, res) {
  const { judul, halaman, author, deskripsi, uploader } = req.body;
  if (!judul || !halaman || !author || !deskripsi || !uploader) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const { id } = req.params;

  const { userId } = req.user; // tambah ini

  try {
    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        judul,
        halaman: Number(halaman),
        author,
        deskripsi,
        uploader,
        userId, // dan ini
      },
    });

    // Kirim response status 200 dengan data buku yang telah diperbarui
    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createUserProfile(req, res) {
  // validate req body from user
  if (!req.body.nama) {
    return res.status(400).send({ message: 'Name diperlukan' });
  }
  if (!req.body.alamat) {
    return res.status(400).send({ message: 'Alamat diperlukan' });
  }
  if (!req.body.bio) {
    return res.status(400).send({ message: 'Bio diperlukan' });
  }

  const { nama, alamat, bio } = req.body;
  const { userId } = req.user;
  try {
    const newProfile = await prisma.profile.create({
      data: {
        nama,
        alamat,
        bio,
        userId,
      },
    });
    res.status(201).send(newProfile);
  } catch (error) {
    console.log('create Profile Error', error);
    res.status(500).send({ message: 'gagal menambahkan profile' });
  }
}

async function getUserProfile(req, res) {
  const { userId } = req.user;
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId,
      },
    });
    res.status(200).send(profile);
  } catch (error) {
    res.status(500).send({ message: 'gagal mendapatkan profile' });
  }
}

async function updateUserProfile(req, res) {
  const { userId } = req.user; // Mengambil userId dari token yang terverifikasi
  const { nama, alamat, bio } = req.body; // Data profil baru dari permintaan

  if (!nama || !alamat || !bio) {
    return res.status(400).json({ error: 'Semua field (nama, alamat, bio) harus diisi' });
  }

  try {
    const updatedProfile = await prisma.profile.update({
      where: { userId: userId },
      data: { nama, alamat, bio },
    });

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate profil' });
  }
}

async function likeOrDislike(req, res) {
  try {
    const userId = req.user.id;
    const bookId = parseInt(req.params.bookId);

    // Cek apakah buku sudah dilike oleh user
    const like = await prisma.like.findUnique({
      where: {
        userId_bookId: {
          bookId: bookId,
          userId: userId,
        },
      },
    });

    if (!like) {
      // Jika buku belum dilike, tambahkan like
      await prisma.like.create({
        data: {
          userId: userId,
          bookId: bookId,
        },
      });
      res.status(200).json({ message: "Buku telah dilike." });
    } else {
      // Jika buku sudah dilike, hapus like
      await prisma.like.delete({
        where: {
          id: like.id,
        },
      });
      res.status(200).json({ message: "Buku telah di-dislike." });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses like/dislike." });
  }
}

module.exports = { likeOrDislike, updateUserProfile, getUserProfile, createUserProfile, getAllBooks, createBook, updateBookById, deleteBookById, register, login };
