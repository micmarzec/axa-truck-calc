import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateXML, XMLData } from '@/lib/xml-generator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
        }

        const cert = await prisma.certificate.findUnique({
            where: { id: Number(id) }
        });

        if (!cert) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        let formData;
        try {
            formData = JSON.parse(cert.daneKlienta);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON data in DB' }, { status: 500 });
        }

        const xmlData: XMLData = {
            numerUmowy: formData.numerUmowy,
            numerCertyfikatu: cert.numerCertyfikatu,
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
            dataPierwszejRejestracji: formData.pojazdDataRejestracji,
            latT6Z: formData.latT6Z,
            latT10Z: formData.latT10Z,
            skladkaT6Z: formData.skladkaT6Z,
            skladkaT10Z: formData.skladkaT10Z,
            skladka: formData.skladka
        };

        const xmlContent = generateXML(xmlData);
        const fileName = `Contract_${cert.numerCertyfikatu.replace(/\//g, '_')}.xml`;

        return new NextResponse(xmlContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        });

    } catch (error) {
        console.error('Download XML Error:', error);
        return NextResponse.json({ error: 'Failed to generate XML' }, { status: 500 });
    }
}
