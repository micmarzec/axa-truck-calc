import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findFirst();
    if (!user) return;
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey_truckcalc', { expiresIn: '1h' });

    const formData = {
        numerUmowy: "TEST-123",
        firmaName: "Firma",
        firmaNIP: "1234567890",
        firmaUlica: "Ulica 1",
        firmaKod: "00-000",
        firmaMiasto: "Miasto",
        pojazdMarka: "Marka",
        pojazdModel: "Model",
        pojazdVIN: "12345678901234567",
        pojazdRej: "WA12345",
        pojazdDataRejestracji: "2020-01-01",
        opcjaUbez: "Basic",
        dataOd: "2026-06-01",
        periodDuration: "12",
        dataDo: "2027-05-31",
        telefon: "123",
        email: "test@test.com"
    };

    const calculation = {
        skladka: 1000,
        skladkaT6Z: 1000,
        skladkaT10Z: 1000,
        dataRozpoczecia: "2026-06-01",
        dataZakonczenia: "2027-05-31"
    };

    try {
        const res = await fetch('http://localhost:4000/api/calculations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                formData,
                calculation,
                parentGroupId: null
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
run().finally(() => prisma.$disconnect());
