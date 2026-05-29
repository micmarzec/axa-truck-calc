import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found");
        return;
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey_truckcalc', { expiresIn: '1h' });

    console.log("Calling API with token...");
    
    try {
        const res = await fetch('http://localhost:4000/api/calculations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                formData: { test: "data" },
                calculation: { price: 100 },
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
