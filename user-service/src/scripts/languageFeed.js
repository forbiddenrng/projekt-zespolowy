const path = require("node:path");
const languages = require(path.join(process.cwd(), "src", "data", "languages.json"))

const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

const languagesData = Object.keys(languages).map(langCode => ({name: languages[langCode]}));

async function createLanguages(){
  try {
    const createMany = await prisma.languages.createMany({
      data: languagesData,
      skipDuplicates: true
    });
    console.log(`Languages created successfuly. Created languages: ${createMany.count}`);
  } catch (err){
    console.log(`Failed to create languages: ${err}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function getLanguages() {
  try {
    const languages = await prisma.languages.findMany();
    console.log(languages);
  } catch (err){
    console.log('Failed to get langages');
  } finally {
    await prisma.$disconnect();
  }
}

createLanguages()
  .catch(error => {
    console.error(error)
  })



