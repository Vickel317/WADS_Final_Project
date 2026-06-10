import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://invalid:invalid@localhost:5432/invalid";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { userId: true, username: true, email: true, role: true },
  });

  console.log("All users:");
  users.forEach((u) => console.log(`  ${u.username} (${u.email}) - role: ${u.role}`));
}

main()
  .catch((error) => {
    console.error("Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
