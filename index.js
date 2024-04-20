const express = require("express");
const app = express();
const port = 3000;

// Middleware untuk membaca body dari request
app.use(express.json());

let listBuku = [
  { judul: "Mari Ngoding", halaman: 100, author: "Dewa" },
  { judul: "Petualangan Sang Penjelajah", halaman: 250, author: "Naya" },
  { judul: "Kisah Kecil Si Pemberani", halaman: 150, author: "Budi" },
  { judul: "Misteri Pulau Tersembunyi", halaman: 200, author: "Citra" },
];

// Endpoint untuk mengakses buku berdasarkan judulnya
app.get("/books/:judul", (req, res) => {
  const judulBuku = req.params.judul;
  const buku = listBuku.find((buku) => buku.judul === judulBuku);

  if (!buku) {
    return res.status(404).send("Buku tidak ditemukan.");
  }

  res.send(buku);
});

// Endpoint untuk menghapus buku berdasarkan judulnya
app.delete("/books/:judul", (req, res) => {
  const judulBuku = req.params.judul;
  const index = listBuku.findIndex((buku) => buku.judul === judulBuku);

  if (index === -1) {
    return res.status(404).send("Buku tidak ditemukan.");
  }

  listBuku.splice(index, 1);
  res.send("Buku berhasil dihapus.");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
