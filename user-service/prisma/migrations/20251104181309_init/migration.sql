-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(9) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "profile_summary" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "linkString" VARCHAR(150) NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "school_name" VARCHAR(100) NOT NULL,
    "major" VARCHAR(100) NOT NULL,
    "degree" VARCHAR(20) NOT NULL,
    "begin_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work_Experience" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "position" VARCHAR(150) NOT NULL,
    "begin_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Work_Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Languages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "level" VARCHAR(6) NOT NULL,

    CONSTRAINT "Languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Languages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,

    CONSTRAINT "User_Languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Certificate" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "certificate_id" INTEGER NOT NULL,

    CONSTRAINT "User_Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technical_Abilities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Technical_Abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Technical_Abilities" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "technical_ability_id" INTEGER NOT NULL,

    CONSTRAINT "User_Technical_Abilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work_Experience" ADD CONSTRAINT "Work_Experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Languages" ADD CONSTRAINT "User_Languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Languages" ADD CONSTRAINT "User_Languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Certificate" ADD CONSTRAINT "User_Certificate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Certificate" ADD CONSTRAINT "User_Certificate_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "Certificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Technical_Abilities" ADD CONSTRAINT "User_Technical_Abilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Technical_Abilities" ADD CONSTRAINT "User_Technical_Abilities_technical_ability_id_fkey" FOREIGN KEY ("technical_ability_id") REFERENCES "Technical_Abilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
