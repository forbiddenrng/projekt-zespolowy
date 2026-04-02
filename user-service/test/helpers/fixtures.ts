import { DatabaseService } from 'src/database/database.service';

let sequence = 1;

function nextSequence() {
  const current = sequence;
  sequence += 1;
  return current;
}

export function xUserHeader(auth0Id: string) {
  return JSON.stringify({ id: auth0Id });
}

export function buildCreateUserPayload(overrides: Record<string, unknown> = {}) {
  const current = nextSequence();

  return {
    auth0Id: `auth0|payload-${current}`,
    name: 'Jan',
    surname: `Kowalski-${current}`,
    phoneNumber: `+48500000${String(100 + current).slice(-3)}`,
    email: `user${current}@example.com`,
    city: 'Gdansk',
    profileSummary: 'Experienced backend engineer building reliable systems.',
    ...overrides,
  };
}

export async function createUserRecord(
  prisma: DatabaseService,
  overrides: Record<string, unknown> = {},
) {
  const current = nextSequence();

  const baseData = {
    auth0_id: `auth0|seed-${current}`,
    name: 'Anna',
    surname: `Nowak-${current}`,
    phone_number: `+48600000${String(100 + current).slice(-3)}`,
    email: `seed${current}@example.com`,
    city: 'Warsaw',
    profile_summary: 'Experienced product engineer focused on delivery quality.',
  };

  return prisma.user.create({
    data: {
      ...baseData,
      ...overrides,
    },
  });
}
