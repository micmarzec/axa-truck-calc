import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateXML, XMLData } from '@/lib/xml-generator';
import JSZip from 'jszip';

/**
 * @swagger
 * /certificates/bulk-xml:
 *   post:
 *     summary: Export multiple certificates as a ZIP archive of XML files
 *     description: Accepts an array of certificate IDs and returns a ZIP file containing the corresponding XML declarations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of certificate IDs to export.
 *     responses:
 *       200:
 *         description: A ZIP file containing the XML certificates.
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid or missing IDs array.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: No certificates found for the provided IDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error while generating the ZIP archive.
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
        const { ids } = body; // Array of IDs

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const certificates = await prisma.certificate.findMany({
            where: {
                id: { in: ids }
            }
        });

        if (certificates.length === 0) {
            return NextResponse.json({ error: 'No certificates found' }, { status: 404 });
        }

        const zip = new JSZip();

        // Mapping for variant codes if needed again (reuse from xml-generator or assume generator handles field if we pass raw string? 
        // Generator expects 'wariant' string (Basic/Top/Best+) and maps it internally now.
        // Wait, I updated xml-generator to Map internally! So I just pass the raw variant string.

        for (const cert of certificates) {
            let formData;
            try {
                formData = JSON.parse(cert.daneKlienta);
            } catch (e) {
                console.error(`Failed to parse JSON for cert ${cert.id}`, e);
                continue;
            }

            // Map DB/FormData to XMLData interface
            // Must align with updated xml-generator.ts interface
            const xmlData: XMLData = {
                numerUmowy: formData.numerUmowy,
                numerCertyfikatu: cert.numerCertyfikatu, // Use the generated official number!
                firmaName: formData.firmaName,
                firmaNIP: formData.firmaNIP,
                firmaUlica: formData.firmaUlica,
                firmaKod: formData.firmaKod,
                firmaMiasto: formData.firmaMiasto,
                pojazdMarka: formData.pojazdMarka,
                pojazdModel: formData.pojazdModel,
                pojazdRej: formData.pojazdRej,
                pojazdVIN: formData.pojazdVIN,
                dataRozpoczecia: formData.dataOd,
                dataZakonczenia: formData.dataDo,
                wariant: formData.opcjaUbez,
                dataPierwszejRejestracji: formData.pojazdDataRejestracji
            };

            const xmlContent = generateXML(xmlData);
            const fileName = `Contract_${cert.numerCertyfikatu.replace(/\//g, '_')}.xml`;

            zip.file(fileName, xmlContent);
        }

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

        return new NextResponse(zipContent as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="certificates_export_${Date.now()}.zip"`
            }
        });

    } catch (error) {
        console.error('Bulk XML Error:', error);
        return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 });
    }
}
