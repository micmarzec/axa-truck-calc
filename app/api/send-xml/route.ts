import { NextRequest, NextResponse } from 'next/server';
import { generateXML } from '@/lib/xml-generator';
import { uploadFileToSFTP } from '@/lib/sftp-client';

/**
 * @swagger
 * /send-xml:
 *   post:
 *     summary: Generate and send an XML declaration via SFTP
 *     description: Accepts form data, generates an XML file based on it, and uploads it to the configured SFTP server.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formData:
 *                 type: object
 *                 properties:
 *                   numerUmowy:
 *                     type: string
 *                     description: Contract number.
 *                   firmaName:
 *                     type: string
 *                     description: Company name.
 *                   firmaNIP:
 *                     type: string
 *                   firmaUlica:
 *                     type: string
 *                   firmaKod:
 *                     type: string
 *                   firmaMiasto:
 *                     type: string
 *                   pojazdMarka:
 *                     type: string
 *                   pojazdModel:
 *                     type: string
 *                   pojazdRej:
 *                     type: string
 *                   pojazdVIN:
 *                     type: string
 *                   dataOd:
 *                     type: string
 *                     format: date
 *                   dataDo:
 *                     type: string
 *                     format: date
 *                   opcjaUbez:
 *                     type: string
 *                   pojazdDataRejestracji:
 *                     type: string
 *                     format: date
 *     responses:
 *       200:
 *         description: Successfully generated and sent XML.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fileName:
 *                   type: string
 *       400:
 *         description: Missing required data (e.g., numerUmowy or firmaName).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to generate or send XML.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { formData } = body;

        // Validate (Basic)
        if (!formData.numerUmowy || !formData.firmaName) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 1. Generate XML
        const xml = generateXML({
            numerUmowy: formData.numerUmowy,
            firmaName: formData.firmaName,
            firmaNIP: formData.firmaNIP,
            firmaUlica: formData.firmaUlica,
            firmaKod: formData.firmaKod,
            firmaMiasto: formData.firmaMiasto,
            pojazdMarka: formData.pojazdMarka,
            pojazdModel: formData.pojazdModel,
            pojazdRej: formData.pojazdRej,
            pojazdVIN: formData.pojazdVIN || 'UNKNOWN',
            dataRozpoczecia: formData.dataOd,
            dataZakonczenia: formData.dataDo, // Mapped
            wariant: formData.opcjaUbez,      // Mapped
            dataPierwszejRejestracji: formData.pojazdDataRejestracji // Mapped
        });

        // 2. Send via SFTP
        const fileName = `Declaration_${formData.numerUmowy}_${Date.now()}.xml`;
        await uploadFileToSFTP(fileName, xml);

        return NextResponse.json({ success: true, fileName });

    } catch (error) {
        console.error('XML Send Error:', error);
        return NextResponse.json({ error: 'Failed to send XML' }, { status: 500 });
    }
}
