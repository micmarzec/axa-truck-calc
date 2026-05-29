import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findFirst();
    if (!user) return;
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey_truckcalc', { expiresIn: '1h' });

    try {
        const res = await fetch('http://localhost:4000/api/calculations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Calculations count:", data.length);
        if (data.length > 0) {
            console.log("First calc:", data[0].id, data[0].groupId);
        }
    } catch (e) {
        console.error(e);
    }
}
run().finally(() => prisma.$disconnect());
