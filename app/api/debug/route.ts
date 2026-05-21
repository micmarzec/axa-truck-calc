import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /debug:
 *   get:
 *     summary: Debug endpoint for clearing test data
 *     description: Deletes all certificates where numerUmowy is "TEST". Intended for development and debugging purposes.
 *     responses:
 *       200:
 *         description: Successfully cleared test data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Failed to clear data.
 */
export async function GET() {
    try {
        await prisma.certificate.deleteMany({
            where: { numerUmowy: "TEST" }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
