import { create } from 'xmlbuilder2';

export interface XMLData {
    numerUmowy: string; // XXXX...
    numerCertyfikatu?: string; // Prefix + 6 digits
    firmaName: string;
    firmaNIP: string;
    firmaUlica: string;
    firmaKod: string;
    firmaMiasto: string;
    pojazdMarka: string;
    pojazdModel: string;
    pojazdRej: string;
    pojazdVIN: string; // Used? Field 17 not explicit in snippet but standard
    dataRozpoczecia: string; // YYYY-MM-DD
    dataZakonczenia: string; // YYYY-MM-DD
    wariant: string;
    dataPierwszejRejestracji: string; // YYYY-MM-DD
}

export function generateXML(data: XMLData): string {
    // Constant prefix for contract number if needed, strictly following spec
    // Spec says: declaration from: XXXX

    const productMap: Record<string, string> = {
        'Basic': '01',
        'Top': '02',
        'Best+': '03'
    };
    const productCode = productMap[data.wariant] || data.wariant;

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('ContractInstructions') // Root element assumption based on snippet
        .ele('DeclarationFrom').txt('XXXX').up() // 1. Constant
        .ele('AuthenticatedID').txt('123456').up() // 2. ID verifying sender (Mock)
        .ele('MessageSequenceID').txt('1').up() // 3. Message order

        .ele('contractInsurance')
        .ele('type').txt('I').up()
        .ele('num').txt(data.numerCertyfikatu || data.numerUmowy || '').up() // Prefer Certificate Number if available
        .ele('ipa').txt('PL').up()
        .ele('productCode').txt(productCode).up() // Mapped code
        .ele('signDate').txt(new Date().toISOString().split('T')[0]).up()
        .up()

        .ele('installment')
        .ele('frequency').txt('YEAR').up()
        .up()

        .ele('holder')
        .ele('type').txt('PO').up()
        .ele('po')
        .ele('name').txt(data.firmaName || '').up()
        .ele('ic').txt(data.firmaNIP || '').up()
        .up()
        .ele('adr')
        .ele('street').txt(data.firmaUlica || '').up()
        .ele('zipCode').txt(data.firmaKod || '').up()
        .ele('city').txt(data.firmaMiasto || '').up()
        .ele('country').txt('PL').up()
        .up()
        .up()

        .ele('object')
        .ele('registrationNum').txt(data.pojazdRej || '').up()
        .ele('vin').txt(data.pojazdVIN || '').up()
        .ele('make').txt(data.pojazdMarka || '').up()
        .ele('model').txt(data.pojazdModel || '').up()
        .ele('firstRegistrationDate').txt(data.dataPierwszejRejestracji || '').up() // New field
        .up()

        .ele('coverage')
        .ele('startDate').txt(data.dataRozpoczecia || '').up()
        .ele('endDate').txt(data.dataZakonczenia || '').up() // New field
        .up()

        .up();

    const xml = doc.end({ prettyPrint: true });
    return xml;
}
