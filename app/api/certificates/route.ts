
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /certificates:
 *   post:
 *     summary: Issue a new certificate
 *     description: Creates a new certificate record in the database, generates a serial number, and associates form data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formData:
 *                 type: object
 *                 description: Form data associated with the certificate.
 *     responses:
 *       200:
 *         description: Successfully created the certificate.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 numerCertyfikatu:
 *                   type: string
 *                 id:
 *                   type: integer
 *       400:
 *         description: Missing form data.
 *       500:
 *         description: Failed to issue the certificate.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { formData } = body;

        if (!formData) {
            return NextResponse.json({ error: 'Brak danych formularza' }, { status: 400 });
        }

        // Transaction: Create -> Generate Number -> Update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create record with TEMP number
            const cert1 = await tx.certificate.create({
                data: {
                    numerCertyfikatu: 'TEMP', // Placeholder
                    numerUmowy: formData.numerUmowy,
                    daneKlienta: JSON.stringify(formData),
                    dataWystawienia: new Date()
                }
            });

            const PREFIX = "CER";
            const requiresTwoNumbers = formData.latT6Z > 0 && formData.latT10Z > 0;
            let finalNumerCertyfikatu = '';

            if (requiresTwoNumbers) {
                // Create a second record to consume an ID
                const cert2 = await tx.certificate.create({
                    data: {
                        numerCertyfikatu: 'TEMP2',
                        numerUmowy: formData.numerUmowy,
                        daneKlienta: JSON.stringify(formData),
                        dataWystawienia: new Date()
                    }
                });

                const n1 = `${PREFIX}${String(cert1.id).padStart(6, '0')}`;
                const n2 = `${PREFIX}${String(cert2.id).padStart(6, '0')}`;
                finalNumerCertyfikatu = `${n1}, ${n2}`;

                // Delete the second placeholder so it doesn't show up in tables/lists as a duplicate
                await tx.certificate.delete({ where: { id: cert2.id } });
            } else {
                finalNumerCertyfikatu = `${PREFIX}${String(cert1.id).padStart(6, '0')}`;
            }

            // 3. Update record with final number
            const updated = await tx.certificate.update({
                where: { id: cert1.id },
                data: { numerCertyfikatu: finalNumerCertyfikatu }
            });

            return updated;
        });

        return NextResponse.json({
            success: true,
            numerCertyfikatu: result.numerCertyfikatu,
            id: result.id
        });

    } catch (error) {
        console.error('Certificate Issuance Error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Błąd wystawiania certyfikatu: ' + msg }, { status: 500 });
    }
}

/**
 * @swagger
 * /certificates:
 *   get:
 *     summary: Retrieve a list of certificates
 *     description: Fetches certificates from the database, optionally filtered by start and end date of issuance.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter certificates issued on or after this date.
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter certificates issued on or before this date.
 *     responses:
 *       200:
 *         description: List of certificates.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   numerCertyfikatu:
 *                     type: string
 *                   numerUmowy:
 *                     type: string
 *                   dataWystawienia:
 *                     type: string
 *                     format: date-time
 *                   daneKlienta:
 *                     type: string
 *       500:
 *         description: Failed to fetch certificates.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            where.dataWystawienia = { gte: start };
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            // If we already have startDate, add lte to the object
            // Use AND if you want precise control, but simple property assignment works for single field range
            // BUT prisma shorthand for range on same field is:
            // where.dataWystawienia = { ...where.dataWystawienia, lte: end }
            where.dataWystawienia = {
                ...where.dataWystawienia,
                lte: end
            };
        }

        const certificates = await prisma.certificate.findMany({
            where,
            orderBy: { dataWystawienia: 'desc' }
        });

        return NextResponse.json(certificates);
    } catch (error) {
        console.error('Fetch Certificates Error:', error);
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }
}
