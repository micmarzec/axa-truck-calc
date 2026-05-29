import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Product DROP CONSTRAINT [Product_commission_df];`);
    console.log("Dropped constraint");
  } catch (e) { 
    console.error(e); 
  }
}
run().finally(() => prisma.$disconnect());
