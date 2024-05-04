-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "halaman" INTEGER NOT NULL,
    "author" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);
