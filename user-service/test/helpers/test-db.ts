import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  GenericContainer,
  StartedTestContainer,
  Wait,
} from 'testcontainers';
import { DatabaseService } from 'src/database/database.service';

const USER_SERVICE_ROOT = path.resolve(__dirname, '../..');
const PRISMA_BIN = path.join(
  USER_SERVICE_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
);

const SEEDED_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Polish', code: 'pl' },
  { name: 'German', code: 'de' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
] as const;

export const TEST_LANGUAGE_IDS = {
  english: 1,
  polish: 2,
  german: 3,
  spanish: 4,
  french: 5,
} as const;

export interface TestDatabaseContext {
  container: StartedTestContainer;
  databaseUrl: string;
}

function runPrismaCommand(args: string[]) {
  execFileSync(PRISMA_BIN, args, {
    cwd: USER_SERVICE_ROOT,
    env: process.env,
    stdio: 'pipe',
  });
}

export async function startTestDatabase(): Promise<TestDatabaseContext> {
  const container = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_DB: 'user_service_test',
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start();

  const databaseUrl = `postgresql://postgres:postgres@${container.getHost()}:${container.getMappedPort(
    5432,
  )}/user_service_test?schema=public`;

  process.env.DATABASE_URL = databaseUrl;

  runPrismaCommand(['migrate', 'deploy']);

  return { container, databaseUrl };
}

export async function stopTestDatabase(context: TestDatabaseContext) {
  await context.container.stop();
}

export async function resetDatabase(prisma: DatabaseService) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "User_Languages",
      "Abilities",
      "Certificate",
      "Education",
      "Link",
      "Work_Experience",
      "Languages",
      "User"
    RESTART IDENTITY CASCADE;
  `);
}

export async function seedLanguages(prisma: DatabaseService) {
  await prisma.languages.createMany({
    data: SEEDED_LANGUAGES.map((language) => ({
      name: language.name,
      code: language.code,
    })),
  });
}
