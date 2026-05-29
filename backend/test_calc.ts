import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const newCalc = await prisma.calculation.create({
            data: {
                groupId: "test-group-id",
                version: 1,
                daneKlienta: JSON.stringify({ name: "test" }),
                wynikKalkulacji: JSON.stringify({ price: 100 }),
                userId: 1,
                validUntil: new Date()
            }
        });
        console.log("Success:", newCalc);
    } catch (e) {
        console.error("Failed:", e);
    }
}
run().finally(() => prisma.$disconnect());
