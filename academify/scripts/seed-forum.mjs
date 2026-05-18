import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://invalid:invalid@localhost:5432/invalid";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const forum = await prisma.forumHub.create({
    data: {
      name: "General",
      description: "General discussions",
    },
  });

  console.log("Created forum:", forum);
}

main()
  .catch((error) => {
    console.error("Seed forum failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
