import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export async function resetDatabase() {
  await testPrisma.refreshToken.deleteMany({});
  await testPrisma.activity.deleteMany({});
  await testPrisma.attachment.deleteMany({});
  await testPrisma.comment.deleteMany({});
  await testPrisma.task.deleteMany({});
  await testPrisma.project.deleteMany({});
  await testPrisma.membership.deleteMany({});
  await testPrisma.workspace.deleteMany({});
  await testPrisma.user.deleteMany({});
}
