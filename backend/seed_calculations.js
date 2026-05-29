const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const opcje = ['Basic', 'Top', 'Best+'];

const seed = async () => {
    console.log('Seeding 50 random calculations...');

    // Get an admin user or first user
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: { username: 'testuser', password: 'password', role: 'USER' }
        });
    }

    for (let i = 0; i < 50; i++) {
        const opcja = opcje[Math.floor(Math.random() * opcje.length)];
        const createdAt = randomDate(new Date(2023, 0, 1), new Date());
        
        const validUntil = new Date(createdAt);
        validUntil.setDate(validUntil.getDate() + 60);

        const formData = {
            numerUmowy: `UM-${Math.floor(Math.random() * 100000)}`,
            firmaName: `Firma Testowa ${i}`,
            firmaNIP: `1234567${String(i).padStart(3, '0')}`,
            pojazdMarka: 'Volvo',
            pojazdModel: 'FH',
            pojazdVIN: `WBA000000000000${String(i).padStart(2, '0')}`,
            opcjaUbez: opcja,
            dataOd: createdAt.toISOString().split('T')[0],
            periodDuration: '12',
            skladka: Math.floor(Math.random() * 1000) + 500,
            prowizja: Math.floor(Math.random() * 200) + 100
        };

        const result = {
            skladkaCalkowita: formData.skladka,
            latCalkowite: 5,
            skladkaT6Z: formData.skladka,
            skladkaT10Z: 0
        };

        await prisma.calculation.create({
            data: {
                groupId: crypto.randomUUID(),
                version: 1,
                userId: user.id,
                daneKlienta: JSON.stringify(formData),
                wynikKalkulacji: JSON.stringify(result),
                createdAt: createdAt,
                validUntil: validUntil
            }
        });
    }

    console.log('Successfully seeded 50 calculations.');
    await prisma.$disconnect();
};

seed().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
