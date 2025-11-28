const path = require("node:path");
const languages = require(path.join(process.cwd(), "src", "data", "languages.json"))

const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

const languagesData = Object.keys(languages).map(langCode => ({name: languages[langCode], code: langCode}));

async function createLanguages(){
  try {
    const createMany = await prisma.languages.createMany({
      data: languagesData,
      skipDuplicates: true
    });
    console.log(`Languages created successfully. Created languages: ${createMany.count}`);
  } catch (err){
    console.error(`Failed to create languages: ${err}`);
  } finally {
    await prisma.$disconnect();
  }
}

createLanguages()
  .catch(error => {
    console.error(error)
  })



