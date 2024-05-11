/*
  Warnings:

  - Added the required column `deskripsi` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploader` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "deskripsi" TEXT NOT NULL,
ADD COLUMN     "uploader" TEXT NOT NULL;
