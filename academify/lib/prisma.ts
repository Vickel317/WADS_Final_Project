import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as BasePrismaClient } from "@prisma/client/edge";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://invalid:invalid@localhost:5432/invalid";

const adapter = new PrismaPg({ connectionString });
const globalForPrisma = globalThis as unknown as {
  prisma: BasePrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new BasePrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;