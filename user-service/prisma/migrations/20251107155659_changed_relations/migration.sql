/*
  Warnings:

  - You are about to drop the `Technical_Abilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User_Certificate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User_Languages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User_Technical_Abilities` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `certification_date` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuer` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."User_Certificate" DROP CONSTRAINT "User_Certificate_certificate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Certificate" DROP CONSTRAINT "User_Certificate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Languages" DROP CONSTRAINT "User_Languages_language_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Languages" DROP CONSTRAINT "User_Languages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Technical_Abilities" DROP CONSTRAINT "User_Technical_Abilities_technical_ability_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Technical_Abilities" DROP CONSTRAINT "User_Technical_Abilities_user_id_fkey";

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "certification_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "issuer" VARCHAR(255) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."Technical_Abilities";

-- DropTable
DROP TABLE "public"."User_Certificate";

-- DropTable
DROP TABLE "public"."User_Languages";

-- DropTable
DROP TABLE "public"."User_Technical_Abilities";

-- CreateTable
CREATE TABLE "Abilities" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LanguagesToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LanguagesToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LanguagesToUser_B_index" ON "_LanguagesToUser"("B");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abilities" ADD CONSTRAINT "Abilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguagesToUser" ADD CONSTRAINT "_LanguagesToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguagesToUser" ADD CONSTRAINT "_LanguagesToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
