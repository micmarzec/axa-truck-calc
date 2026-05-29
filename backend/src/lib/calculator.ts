
export type PackageType = 'Basic' | 'Top' | 'Best+';

// Removed hardcoded PACKAGES

export interface CalculationResult {
    latCalkowite: number;
    latZaliczane: number;
    wiekPoczatkowy: number;
    wiekKoncowy: number;
    latT6Z: number;
    latT10Z: number;
    cenaT6Z: number;
    cenaT10Z: number;
    skladkaT6Z: number;
    skladkaT10Z: number;
    skladkaCalkowita: number;
    miesiecy: number;
    kosztMiesieczny: number;
}

export function obliczWiekPojazdu(dataRejestracji: Date, dataPoczatkowaPolisy: Date): number {
    let wiek = dataPoczatkowaPolisy.getFullYear() - dataRejestracji.getFullYear();
    const miesiaceRoznica = dataPoczatkowaPolisy.getMonth() - dataRejestracji.getMonth();
    if (miesiaceRoznica < 0 || (miesiaceRoznica === 0 && dataPoczatkowaPolisy.getDate() < dataRejestracji.getDate())) {
        wiek--;
    }
    return Math.max(0, wiek);
}

export function calculatePremium(
    wiekPojazdu: number,
    cenaT6Z: number,
    cenaT10Z: number,
    dataOd: Date,
    dataDo: Date
): CalculationResult {
    // Obliczenie całkowitej liczby lat
    const diffTime = Math.abs(dataDo.getTime() - dataOd.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const latCalkowite = diffDays / 365.25;
    const latZaliczane = latCalkowite > 0 ? Math.ceil(latCalkowite) : 1;

    // Logika przejścia między taryfami
    let latT6Z = 0;
    let latT10Z = 0;

    // Wiek końcowy określamy dodając czas trwania polisy do wieku początkowego
    const wiekKoncowy = wiekPojazdu + latZaliczane;

    if (wiekKoncowy <= 7) {
        latT6Z = latZaliczane;
    } else if (wiekPojazdu >= 7) {
        latT10Z = latZaliczane;
    } else {
        // Okres mieszany
        latT6Z = 7 - wiekPojazdu;
        latT10Z = wiekKoncowy - 7;
    }

    const skladkaT6Z = latT6Z * cenaT6Z;
    const skladkaT10Z = latT10Z * cenaT10Z;
    const skladkaCalkowita = skladkaT6Z + skladkaT10Z;

    // Koszt miesięczny
    const miesiecy = Math.round(latZaliczane * 12);
    const kosztMiesieczny = miesiecy > 0 ? Number((skladkaCalkowita / miesiecy).toFixed(2)) : 0;

    return {
        latCalkowite: Math.round(latCalkowite * 100) / 100,
        latZaliczane,
        wiekPoczatkowy: wiekPojazdu,
        wiekKoncowy,
        latT6Z: Math.round(latT6Z * 100) / 100,
        latT10Z: Math.round(latT10Z * 100) / 100,
        cenaT6Z,
        cenaT10Z,
        skladkaT6Z,
        skladkaT10Z,
        skladkaCalkowita,
        miesiecy,
        kosztMiesieczny,
    };
}
