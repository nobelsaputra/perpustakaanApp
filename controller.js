const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function register(req, res) {
  //validase email
  if (!req.body.email) {
    return res.status(400).send({ message: 'email diperlukan' });
  }
  //validasi password
  if (!req.body.password) {
    return res.status(400).send({ message: 'password diperlukan' });
  }
  //ambil email dan password dari body
  const { email, password } = req.body;
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 5); // 10 adalah tingkat keamanan hashing
    //buat usernya tambahkan ke db
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    return res.status(201).send({ message: 'User berhasil dibuat' });
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error' });
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
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET); // Menggunakan secretKey untuk signing token, disarankan menggunakan secret yang kuat dan disimpan di lingkungan yang aman.
    // Kirim accessToken sebagai respons
    return res.status(200).send({ accessToken });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

async function getAllBooks(req, res) {
  //read all book table
  try {
    const books = await prisma.book.findMany();
    res.send(books);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

async function createBook(req, res) {
  if (!req.body.judul) {
    return res.status(400).send({ message: 'Judul diperlukan' });
  }
  if (!req.body.halaman) {
    return res.status(400).send({ message: 'Halaman diperlukan' });
  }
  if (!req.body.author) {
    return res.status(400).send({ message: 'Author diperlukan' });
  }
  if (!req.body.deskripsi) {
    return res.status(400).send({ message: 'Deskripsi diperlukan' });
  }
  if (!req.body.uploader) {
    return res.status(400).send({ message: 'Uploader diperlukan' });
  }

  const { judul, halaman, author, deskripsi, uploader } = req.body;

  const { userId } = req.user;

  try {
    const newBook = await prisma.book.create({
      data: {
        judul: judul,
        halaman: Number(halaman),
        author,
        deskripsi,
        uploader,
        userId,
      },
    });

    res.status(201).send(newBook);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Gagal menambahkan books' });
  }
}

async function getOneBookById(req, res) {
  const bookId = parseInt(req.params.id);

  try {
    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      include: {
        likes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!book) {
      return res.status(404).send({ message: 'Buku tidak ditemukan' });
    }

    const totalLikes = book.likes.length;
    const likedBy = book.likes.map((like) => ({
      id: like.user.id,
      email: like.user.email,
    }));

    res.send({
      ...book,
      totalLikes,
      likedBy,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Terjadi kesalahan server' });
  }
}

async function deleteBookById(req, res) {
  const bookId = parseInt(req.params.id);
  const { userId } = req.user;
  try {
    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });

    if (!book) {
      return res.status(404).send({ message: 'Buku tidak ditemukan' });
    }

    if (book.userId !== userId) {
      return res.status(403).send({
        message: 'Anda tidak memiliki akses untuk menghapus buku ini',
      });
    }

    await prisma.book.delete({
      where: {
        id: bookId,
      },
    });

    res.send({ message: 'Buku berhasil dihapus' });
  } catch (error) {
    res.status(500).send({ message: 'Terjadi kesalahan server' });
  }
}

async function updateBookById(req, res) {
  // Validasi input dari req.body
  const { judul, halaman, author, deskripsi, uploader } = req.body;
  const { id } = req.params;

  const { userId } = req.user;

  // Cek apakah semua field ada
  if (!judul || !halaman || !author || !deskripsi || !uploader) {
    return res.status(400).json({ error: 'Semua field harus diisi' });
  }

  try {
    // Cari buku berdasarkan id
    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    // Jika buku tidak ditemukan
    if (!book) {
      return res.status(404).json({ error: 'Buku tidak ditemukan' });
    }

    if (book.userId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengupdate buku ini' });
    }

    // Update buku berdasarkan id
    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        judul,
        halaman: Number(halaman),
        author,
        deskripsi,
        uploader,
      },
    });

    // Kirim response status 200 dengan data buku yang sudah diupdate
    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate buku' });
  }
}

async function createUserProfile(req, res) {
  if (!req.body.nama) {
    return res.status(400).send({ message: 'Name Diperlukan' });
  }
  if (!req.body.alamat) {
    return res.status(400).send({ message: 'Alamat Diperlukan' });
  }
  if (!req.body.bio) {
    return res.status(400).send({ message: 'Bio Diperlukan' });
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
    res.status(500).send({ message: 'Gagal menambahkan profile' });
  }
}

async function getUserProfile(req, res) {
  const { userId } = req.user;
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: userId,
      },
    });

    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ message: 'Gagal mendapatkan profile' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Terjadi kesalahan server' });
  }
}

async function updateUserProfile(req, res) {
  try {
    const userId = req.user.userId; // Mengambil userId dari token
    const { nama, alamat, bio } = req.body;

    // Validasi data masuk
    if (!nama || !alamat || !bio) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    // Update profil pengguna
    const updatedProfile = await prisma.profile.update({
      where: { userId: userId },
      data: {
        nama: nama,
        alamat: alamat,
        bio: bio,
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function likeOrDislike(req, res) {
  const userId = req.user.userId;
  const bookId = parseInt(req.params.bookId);

  try {
    // Cek apakah buku dengan bookId ada
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return res.status(404).json({ error: 'Buku tidak ditemukan' });
    }

    // Cek apakah user sudah me-like buku ini
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_bookId: {
          userId: userId,
          bookId: bookId,
        },
      },
    });

    if (existingLike) {
      // Jika sudah di-like, lakukan dislike (hapus like)
      await prisma.like.delete({
        where: {
          userId_bookId: {
            userId: userId,
            bookId: bookId,
          },
        },
      });
      return res.status(200).json({ message: 'Buku telah di-dislike' });
    } else {
      // Jika belum di-like, lakukan like
      await prisma.like.create({
        data: {
          user: {
            connect: { id: userId },
          },
          book: {
            connect: { id: bookId },
          },
        },
      });
      return res.status(200).json({ message: 'Buku telah di-like' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}

module.exports = {
  likeOrDislike,
  updateUserProfile,
  getUserProfile,
  createUserProfile,
  getAllBooks,
  createBook,
  getOneBookById,
  deleteBookById,
  register,
  login,
  updateBookById,
};
