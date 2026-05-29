import { create } from 'xmlbuilder2';
import { AppConfig } from './config';

export interface XMLData {
    numerUmowy: string; 
    numerCertyfikatu?: string; 
    firmaName: string;
    firmaNIP: string;
    firmaUlica: string;
    firmaKod: string;
    firmaMiasto: string;
    pojazdMarka: string;
    pojazdModel: string;
    pojazdRej: string;
    pojazdVIN: string; 
    dataRozpoczecia: string; 
    dataZakonczenia: string; 
    wariant: string;
    dataPierwszejRejestracji: string; 
    latT6Z?: number;
    latT10Z?: number;
    skladkaT6Z?: number;
    skladkaT10Z?: number;
    skladka?: number;
    xmlPartnerId?: string;
}

const addYearsToDate = (dateStr: string, years: number): string => {
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split('T')[0];
};

export function generateXML(data: XMLData): string {
    const productCode = AppConfig.products[data.wariant as keyof typeof AppConfig.products]?.code || '01';
    
    // Parse certificate numbers
    const certString = data.numerCertyfikatu || data.numerUmowy || '';
    const certs = certString.split(',').map(s => s.trim());
    const cert1 = certs[0];
    const cert2 = certs.length > 1 ? certs[1] : cert1;

    // Date formatting
    const now = new Date();
    // Offset for Poland is roughly +01:00 or +02:00
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const pad = (num: number) => String(num).padStart(2, '0');
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMins = pad(Math.abs(offset) % 60);
    const sentDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${sign}${offsetHours}:${offsetMins}`;
    
    const signDate = now.toISOString().split('T')[0];
    const madeYear = data.dataPierwszejRejestracji ? data.dataPierwszejRejestracji.substring(0, 4) : '';

    const doc = create({ version: '1.0', encoding: 'utf-8' })
        .ele('Message', { from: data.xmlPartnerId || 'PEKAO_TA', sent: sentDate, sequenceID: '1' })
            .ele('contractInsurances')
                .ele('contractInsurance', { type: 'I', num: cert1, ipa: 'PL', signDate: signDate, signTime: '' })
                    .ele('installment', { frequency: 'YEAR' }).up()
                    .ele('holder', { type: 'PO' })
                        .ele('adr', { street: data.firmaUlica, zipCode: data.firmaKod, town: data.firmaMiasto, state: 'PL' }).up()
                        .ele('po', { name: data.firmaName, ic: data.firmaNIP }).up()
                    .up()
                    .ele('insurances');

    // Check if we have two tariffs
    const hasT6Z = (data.latT6Z && data.latT6Z > 0);
    const hasT10Z = (data.latT10Z && data.latT10Z > 0);
    const isDoubleTariff = hasT6Z && hasT10Z;

    const buildInsuranceNode = (
        parent: any, 
        tarif: string, 
        validFrom: string, 
        validTo: string, 
        numCust: string, 
        price: string
    ) => {
        const ins = parent.ele('insurance', { 
            status: 'OK', 
            validTo: validTo, 
            validFrom: validFrom, 
            numAxa: '68076', 
            numCust: numCust, 
            pk: 'NEW' 
        });

        ins.ele('products')
            .ele('product', { numAxa: productCode, tarif: tarif, price: price, discount: '0' }).up()
        .up()
        .ele('subject', { pk: 'NEW', type: 'CAR' })
            .ele('car', { 
                vin: data.pojazdVIN, 
                spz: data.pojazdRej, 
                company: data.pojazdMarka, 
                model: data.pojazdModel, 
                madeYear: madeYear, 
                type: 'NV' 
            }).up()
        .up()
        .ele('insured', { type: 'PO' })
            .ele('adr', { street: data.firmaUlica, zipCode: data.firmaKod, town: data.firmaMiasto, state: 'PL' }).up()
            .ele('po', { name: data.firmaName, ic: data.firmaNIP }).up()
        .up()
        .ele('note').txt('truck').up();
    };

    if (isDoubleTariff) {
        const transitionDate = addYearsToDate(data.dataRozpoczecia, data.latT6Z!);
        buildInsuranceNode(doc, 'T6Z', data.dataRozpoczecia, transitionDate, cert1, data.skladkaT6Z?.toFixed(2) || '0.00');
        buildInsuranceNode(doc, 'T10Z', transitionDate, data.dataZakonczenia, cert2, data.skladkaT10Z?.toFixed(2) || '0.00');
    } else {
        // Single tariff
        let singleTariff = 'T6Z';
        if (hasT10Z) singleTariff = 'T10Z'; // If only T10Z is present
        buildInsuranceNode(doc, singleTariff, data.dataRozpoczecia, data.dataZakonczenia, cert1, data.skladka?.toFixed(2) || '0.00');
    }

    doc.up() // up from insurances
        .ele('commission', { oz: '20005', zp: '13000448', sign: '13000448' }).up()
        .up() // up from contractInsurance
        .up() // up from contractInsurances
        .up(); // up from Message

    return doc.end({ prettyPrint: true });
}
