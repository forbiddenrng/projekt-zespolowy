const path = require("node:path");

const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

async function deleteLanguages(){
  try {
    const deleteMany = await prisma.languages.deleteMany({})

    console.log(`Languages deleted successfully. Deleted languages: ${deleteMany.count}`);
  } catch (err){
    console.error(`Failed to delete languages: ${err}`);
  } finally {
    await prisma.$disconnect();
  }
}

deleteLanguages()
  .catch(error => {
    console.error(error)
  })



