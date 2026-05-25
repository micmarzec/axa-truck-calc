import { NextRequest, NextResponse } from 'next/server';
import { generateXML } from '@/lib/xml-generator';

/**
 * @swagger
 * /download-xml:
 *   post:
 *     summary: Generate and download an XML declaration
 *     description: Accepts form data, generates an XML file based on it, and sends it directly as an attachment for download.
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
 *         description: XML file of the declaration.
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing required data (e.g., numerUmowy or firmaName).
 *       500:
 *         description: Server error or generation logic failed.
 */
export async function POST(req: NextRequest) {
    try {
        console.log("XML API: Received request");
        const body = await req.json();
        const { formData, calculation } = body;
        console.log("XML API: FormData received", JSON.stringify(formData));

        if (!formData.numerUmowy || !formData.firmaName) {
            console.error("XML API: Missing required data");
            return NextResponse.json({ error: 'Missing data (numerUmowy or firmaName)' }, { status: 400 });
        }

        try {
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
                dataZakonczenia: formData.dataDo, 
                wariant: formData.opcjaUbez,      
                dataPierwszejRejestracji: formData.pojazdDataRejestracji,
                latT6Z: calculation?.latT6Z,
                latT10Z: calculation?.latT10Z,
                skladkaT6Z: calculation?.skladkaT6Z,
                skladkaT10Z: calculation?.skladkaT10Z,
                skladka: calculation?.skladkaCalkowita
            });
            console.log("XML API: Generation success, length: " + xml.length);

            // Return as downloadable file
            return new NextResponse(xml, {
                status: 200,
                headers: {
                    'Content-Type': 'application/xml',
                    'Content-Disposition': `attachment; filename="Contract_${formData.numerUmowy}.xml"`
                }
            });
        } catch (genError: unknown) {
            console.error('XML API: Generation Logic Error:', genError);
            const msg = genError instanceof Error ? genError.message : String(genError);
            return NextResponse.json({ error: 'Generation Logic Failed: ' + msg }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('XML API: Top Level Error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Server Error: ' + msg }, { status: 500 });
    }
}
