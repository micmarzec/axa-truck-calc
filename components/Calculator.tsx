"use client"

import React, { useState, useEffect } from "react"
import { PackageType, CalculationResult, calculatePremium } from "@/lib/calculator"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Label } from "./ui/Primitives"
import { Select } from "./ui/Primitives"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Primitives"
import { Calculator, FileText, Send, CheckCircle, AlertCircle } from "lucide-react"

import { pdf } from "@react-pdf/renderer"
import { DeclarationDocument } from "./documents/DeclarationDocument"
import { CertificateDocument } from "./documents/CertificateDocument"
import { Modal } from "./ui/Modal"

const validateNIP = (nip: string) => {
    const str = nip.replace(/[\s-]/g, '');
    if (str.length !== 10 || !/^\d{10}$/.test(str)) return false;
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(str[i], 10) * weights[i];
    }
    return (sum % 11) === parseInt(str[9], 10);
};

const validateVIN = (vin: string): { isValid: boolean; errorMessage: string | null; parsedData?: { WMI: string; VDS: string; VIS: string } } => {
    const cleaned = vin.trim().toUpperCase();

    if (cleaned.length !== 17) {
        return { isValid: false, errorMessage: "VIN musi mieć dokładnie 17 znaków" };
    }
    if (/[IOQ]/.test(cleaned)) {
        return { isValid: false, errorMessage: "VIN zawiera niedozwolone znaki (I, O lub Q)" };
    }
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) {
        return { isValid: false, errorMessage: "VIN zawiera niedozwolone znaki" };
    }

    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const charValues: Record<string, number> = {
        'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
        'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5,
        'P': 7,
        'R': 9,
        'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
    };

    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += charValues[cleaned[i]] * weights[i];
    }

    const remainder = sum % 11;
    const expectedChecksum = remainder === 10 ? 'X' : remainder.toString();

    if (cleaned[8] !== expectedChecksum) {
        return { isValid: false, errorMessage: "Niepoprawna suma kontrolna - prawdopodobna literówka" };
    }

    return {
        isValid: true,
        errorMessage: null,
        parsedData: {
            WMI: cleaned.substring(0, 3),
            VDS: cleaned.substring(3, 9),
            VIS: cleaned.substring(9, 17)
        }
    };
};

const validateRegNum = (rej: string) => {
    const str = rej.replace(/\s/g, '').toUpperCase();
    return /^[A-Z0-9]{4,8}$/.test(str);
};

export default function CalculatorComponent() {
    // Helper to get tomorrow's date string YYYY-MM-DD
    const getTomorrow = () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d.toISOString().split('T')[0]
    }

    const formatCurrency = (val: number) => {
        return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    const formatDuration = (years: number): string => {
        // Strip trailing zeros if integer
        const val = parseFloat(years.toFixed(2));

        // Grammar rules
        if (val === 1) return `${val} rok`;

        // Check if integer
        if (Number.isInteger(val)) {
            const lastDigit = val % 10;
            const lastTwo = val % 100;

            if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
                return `${val} lata`;
            }
        }

        return `${val} lat`;
    }

    const [formData, setFormData] = useState({
        numerUmowy: "",
        firmaName: "",
        firmaNIP: "",
        firmaUlica: "",
        firmaKod: "",
        firmaMiasto: "",
        pojazdMarka: "",
        pojazdModel: "",
        pojazdVIN: "",
        pojazdRej: "",
        pojazdDataRejestracji: "",
        opcjaUbez: "" as PackageType | "",
        dataOd: getTomorrow(),
        periodDuration: "12", // Default 12 months
        dataDo: "" // Calculated automatically
    })

    const [result, setResult] = useState<CalculationResult | null>(null)
    const [errors, setErrors] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [issuedNumber, setIssuedNumber] = useState<string | null>(null)

    // Modal State
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        content: React.ReactNode;
        type?: 'default' | 'danger' | 'success';
        onConfirm?: () => void;
        confirmText?: string;
    }>({ isOpen: false, title: "", content: null });

    const openAlert = (title: string, content: React.ReactNode, type: 'default' | 'danger' | 'success' = 'default') => {
        setModal({ isOpen: true, title, content, type });
    };

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    // Auto-calculate dataDo when dataOd or periodDuration changes
    useEffect(() => {
        if (!formData.dataOd || !formData.periodDuration) return;

        const start = new Date(formData.dataOd);
        const months = parseInt(formData.periodDuration);

        // Add months
        const end = new Date(start);
        end.setMonth(start.getMonth() + months);
        // Subtract 1 day to get the end of the period (e.g., 1 Jan -> 31 Dec)
        end.setDate(end.getDate() - 1);

        setFormData(prev => ({
            ...prev,
            dataDo: end.toISOString().split('T')[0]
        }));
    }, [formData.dataOd, formData.periodDuration]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        // Auto-format Zip Code: XX-XXX
        if (name === "firmaKod") {
            const digits = value.replace(/\D/g, '').slice(0, 5);
            let formatted = digits;
            if (digits.length > 2) {
                formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
            }
            setFormData(prev => ({ ...prev, [name]: formatted }))
            return;
        }

        if (name === "pojazdVIN" || name === "pojazdRej") {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
            return;
        }

        if (name === "firmaNIP") {
            setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCalculate = () => {
        setErrors([])
        const errs: string[] = []

        // Simple Validation
        if (!formData.pojazdDataRejestracji) {
            errs.push("Data pierwszej rejestracji jest wymagana")
        } else {
            const today = new Date().toISOString().split('T')[0];
            if (formData.pojazdDataRejestracji > today) {
                errs.push("Data pierwszej rejestracji nie może być datą z przyszłości")
            }
        }

        if (!formData.dataOd) errs.push("Data początku polisy jest wymagana")
        // dataDo is auto-calculated, check if valid
        if (!formData.dataDo) errs.push("Błąd obliczania daty końcowej")
        if (!formData.opcjaUbez) errs.push("Wybierz opcję ubezpieczenia")

        if (errs.length > 0) {
            setErrors(errs)
            return
        }

        try {
            const dataOdDate = new Date(formData.dataOd);
            const rejestracjaDate = new Date(formData.pojazdDataRejestracji);

            // Calculate initial age (logic from original code)
            const wiek = (dataOdDate.getFullYear() - rejestracjaDate.getFullYear())
                - ((dataOdDate.getMonth() < rejestracjaDate.getMonth() ||
                    (dataOdDate.getMonth() === rejestracjaDate.getMonth() && dataOdDate.getDate() < rejestracjaDate.getDate())
                ) ? 1 : 0)
            const finalWiek = Math.max(0, wiek)

            // Age Validation for Top and Best+
            // Logic: The vehicle age must not exceed 10 years at any point during the insurance period.
            // Simplified: Age at Start + Duration (years) <= 10.
            if (formData.opcjaUbez === 'Top' || formData.opcjaUbez === 'Best+') {
                const durationYears = parseInt(formData.periodDuration) / 12; // 1, 2, 3, 4, 5

                // Example from user: "jak ma 9 lat to można ubezpieczyć wyłącznie na rok" (9 + 1 = 10 -> OK).
                // "Jak ma 6 lat, to maksymalnie 4 lata" (6 + 4 = 10 -> OK).
                // "limit 10 roku eksploatacji" = up to 10 years old.

                if (finalWiek + durationYears > 10) {
                    const maxDuration = Math.max(0, 10 - finalWiek);
                    setErrors([
                        `Dla wariantu ${formData.opcjaUbez} wiek pojazdu nie może przekroczyć 10 lat w trakcie trwania polisy.`,
                        `Twój pojazd ma ${finalWiek} lat. Maksymalny okres ubezpieczenia to ${maxDuration > 0 ? maxDuration + ' lat' : 'brak możliwości (pojazd starszy niż 10 lat)'}.`,
                        `Zmień wariant na BASIC (brak limitu) lub skróć okres ochrony.`
                    ]);
                    return;
                }
            }

            const calculation = calculatePremium(finalWiek, formData.opcjaUbez as PackageType, dataOdDate, new Date(formData.dataDo))
            setResult(calculation)

        } catch (e) {
            console.error(e)
            setErrors(["Błąd podczas obliczeń. Sprawdź format dat."])
        }
    }

    const validateFields = (type: 'deklaracja' | 'certyfikat' | 'xml', showAlert = true): string[] => {
        const missing: string[] = [];

        // Fields required for BOTH Declaration and Certificate (and XML)
        if (!formData.numerUmowy) missing.push("Numer Umowy");
        if (!formData.firmaName) missing.push("Nazwa Firmy");
        if (!formData.firmaNIP) {
            missing.push("NIP");
        } else if (!validateNIP(formData.firmaNIP)) {
            missing.push("NIP jest nieprawidłowy");
        }
        if (!formData.firmaUlica) missing.push("Ulica");
        if (!formData.firmaKod) missing.push("Kod Pocztowy");
        if (!formData.firmaMiasto) missing.push("Miasto");

        if (!formData.pojazdMarka) missing.push("Marka Pojazdu");
        if (!formData.pojazdModel) missing.push("Model Pojazdu");

        // VIN and Registration Number are ONLY required for Certificate/XML
        if (type !== 'deklaracja') {
            if (!formData.pojazdVIN) missing.push("Numer VIN");
            if (!formData.pojazdRej) missing.push("Numer Rejestracyjny");
        }

        if (formData.pojazdVIN) {
            const vinCheck = validateVIN(formData.pojazdVIN);
            if (!vinCheck.isValid) {
                missing.push(`Numer VIN: ${vinCheck.errorMessage}`);
            }
        }

        if (formData.pojazdRej) {
            if (!validateRegNum(formData.pojazdRej)) {
                missing.push("Numer Rejestracyjny jest nieprawidłowy");
            }
        }

        if (!formData.opcjaUbez) missing.push("Wariant Ubezpieczenia");

        if (missing.length > 0 && showAlert) {
            openAlert(
                `Masz braki w formularzu (${type})`,
                <ul className="list-disc pl-5 space-y-1">
                    {missing.map((m, i) => <li key={i}>{m}</li>)}
                </ul>,
                'danger'
            );
        }
        return missing;
    }

    const handleGenerateDocument = async (type: 'deklaracja' | 'certyfikat') => {
        // Collect all errors (both field and calc) to show one comprehensive list
        let allErrors: string[] = [];

        // 1. Check strict fields
        const missingFields = validateFields(type, false); // pass false to not alert inside helper
        if (missingFields.length > 0) {
            allErrors = [...missingFields];
        }

        // 2. Check calculation result
        if (!result) {
            allErrors.push("Brak wyników kalkulacji (kliknij 'Przelicz Składkę')");
        }

        if (allErrors.length > 0) {
            openAlert(
                "Nie można wygenerować dokumentu",
                <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {allErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>,
                'danger'
            )
            return;
        }

        setIsGenerating(true)

        try {
            // Use @react-pdf/renderer
            const MyDocument = type === 'deklaracja'
                ? <DeclarationDocument formData={formData} result={result} />
                : <CertificateDocument formData={formData} result={result} />;

            const blob = await pdf(MyDocument).toBlob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a')
            a.href = url
            a.download = `${type}_${formData.numerUmowy || 'draft'}.pdf`
            document.body.appendChild(a)
            a.click()
            setTimeout(() => window.URL.revokeObjectURL(url), 100)
            document.body.removeChild(a)

        } catch (e) {
            console.error(e)
            console.error(e)
            const msg = e instanceof Error ? e.message : String(e);
            openAlert('Błąd', `Błąd generowania dokumentu: ${msg}`, 'danger')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownloadXML = async () => {
        let allErrors: string[] = [];
        const missingFields = validateFields('xml', false);
        if (missingFields.length > 0) allErrors = [...missingFields];
        if (!result) allErrors.push("Brak wyników kalkulacji");

        if (allErrors.length > 0) {
            openAlert(
                "Nie można pobrać XML",
                <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {allErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>,
                'danger'
            );
            return;
        }

        try {
            console.log("Sending XML request...");
            const res = await fetch('/api/download-xml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData, calculation: result })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(errorData.error || 'Server error ' + res.status);
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Contract_${formData.numerUmowy || 'draft'}.xml`
            document.body.appendChild(a)
            a.click()
            setTimeout(() => window.URL.revokeObjectURL(url), 100)
            document.body.removeChild(a)
        } catch (e: unknown) {
            console.error("XML Client Error:", e)
            const msg = e instanceof Error ? e.message : 'Nieznany błąd';
            openAlert('Błąd pobierania XML', msg, 'danger');
        }
    }

    const handleSendXML = async () => {
        if (!result) return
        if (!validateFields('xml')) return;

        setIsSending(true)
        try {
            const res = await fetch('/api/send-xml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData, calculation: result })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to send')

            openAlert('Sukces!', `Plik ${data.fileName} został wysłany.`, 'success');
        } catch (e) {
            console.error(e)
            openAlert('Błąd wysyłania XML', 'Wystąpił błąd podczas wysyłania pliku.', 'danger');
        } finally {
            setIsSending(false)
        }
    }

    const performIssuance = async () => {
        closeModal();
        setIsGenerating(true)
        try {
            // 3. Call API to Issue
            const payload = { 
                ...formData, 
                skladka: result?.skladkaCalkowita,
                latT6Z: result?.latT6Z,
                latT10Z: result?.latT10Z
            };
            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData: payload })
            });

            // Handle non-JSON response (e.g. 500 page from Next.js)
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await res.text();
                throw new Error("Błąd serwera (otrzymano HTML). Sprawdź logi serwera.");
            }

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Błąd wystawiania');

            const issuedNumber = data.numerCertyfikatu;
            if (!issuedNumber) throw new Error("Brak numeru certyfikatu z API");

            setIssuedNumber(issuedNumber);

            // 4. Generate PDF with Issuance Number
            const MyDocument = <CertificateDocument formData={formData} result={result} issuedNumber={issuedNumber} />;

            const blob = await pdf(MyDocument).toBlob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a')
            a.href = url
            const cleanNum = issuedNumber.replace(/\//g, '_');
            a.download = `Certyfikat_${cleanNum}.pdf`
            document.body.appendChild(a)
            a.click()
            setTimeout(() => window.URL.revokeObjectURL(url), 100)
            document.body.removeChild(a)

            openAlert('Sukces!', `Certyfikat został wystawiony!\nNumer: ${issuedNumber}`, 'success');

        } catch (e: unknown) {
            console.error(e)
            const msg = e instanceof Error ? e.message : String(e);
            openAlert('Błąd wystawiania', msg, 'danger');
        } finally {
            setIsGenerating(false)
        }
    }

    const handleIssueCertificate = async () => {
        // 1. Validation
        let allErrors: string[] = [];
        const missingFields = validateFields('certyfikat', false);
        if (missingFields.length > 0) allErrors = [...missingFields];
        if (!result) allErrors.push("Brak wyników kalkulacji");

        if (allErrors.length > 0) {
            openAlert(
                "Uzupełnij brakujące pola",
                <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {allErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>,
                'danger'
            );
            return;
        }

        // 2. Confirmation Modal
        setModal({
            isOpen: true,
            title: "Potwierdzenie wystawienia",
            content: "Czy potwierdzasz poprawność danych i chcesz WYSTAWIĆ certyfikat? Dane zostaną zapisane w systemie i nadany zostanie oficjalny numer.",
            type: 'default',
            onConfirm: performIssuance,
            confirmText: "Wystaw Certyfikat"
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="premium-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <FileText className="h-5 w-5" />
                            Dane Umowy i Partnera
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Numer Umowy Finansowania</Label>
                            <Input name="numerUmowy" placeholder="np. PL-00123-2026" value={formData.numerUmowy} onChange={handleChange} />
                        </div>
                        {/* Empty for grid alignment or full width? */}
                        <div className="space-y-2 md:col-span-2">
                            <Label>Nazwa Firmy</Label>
                            <Input name="firmaName" placeholder="Pełna nazwa firmy" value={formData.firmaName} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>NIP</Label>
                            <Input name="firmaNIP" placeholder="0000000000" value={formData.firmaNIP} onChange={handleChange} maxLength={10} />
                        </div>
                        <div className="space-y-2">
                            <Label>Ulica i Numer</Label>
                            <Input name="firmaUlica" placeholder="ul. Przykładowa 1" value={formData.firmaUlica} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Kod Pocztowy</Label>
                            <Input name="firmaKod" placeholder="00-000" value={formData.firmaKod} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Miasto</Label>
                            <Input name="firmaMiasto" placeholder="Miasto" value={formData.firmaMiasto} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="premium-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <CheckCircle className="h-5 w-5" />
                            Dane Pojazdu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Marka</Label>
                            <Input name="pojazdMarka" placeholder="np. Volvo" value={formData.pojazdMarka} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Model</Label>
                            <Input name="pojazdModel" placeholder="np. FH" value={formData.pojazdModel} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Numer VIN</Label>
                            <Input name="pojazdVIN" placeholder="17 znaków" value={formData.pojazdVIN} onChange={handleChange} maxLength={17} />
                        </div>
                        <div className="space-y-2">
                            <Label>Numer Rejestracyjny</Label>
                            <Input name="pojazdRej" placeholder="np. WX 12345" value={formData.pojazdRej} onChange={handleChange} maxLength={10} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Data pierwszej rejestracji</Label>
                            <Input type="date" name="pojazdDataRejestracji" value={formData.pojazdDataRejestracji} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="premium-card bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Calculator className="h-5 w-5" />
                            Ubezpieczenie
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Wariant</Label>
                            <Select name="opcjaUbez" value={formData.opcjaUbez} onChange={handleChange}>
                                <option value="">-- Wybierz Wariant --</option>
                                <option value="Basic">Basic</option>
                                <option value="Top">Top</option>
                                <option value="Best+">Best+</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Data Początku</Label>
                            <Input type="date" name="dataOd" value={formData.dataOd} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Okres Ochrony</Label>
                            <Select name="periodDuration" value={formData.periodDuration} onChange={handleChange}>
                                <option value="12">12 miesięcy (1 rok)</option>
                                <option value="24">24 miesiące (2 lata)</option>
                                <option value="36">36 miesięcy (3 lata)</option>
                                <option value="48">48 miesięcy (4 lata)</option>
                                <option value="60">60 miesięcy (5 lat)</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Obliczona Data Końca</Label>
                            <Input type="date" name="dataDo" value={formData.dataDo || ""} disabled className="bg-gray-100 opacity-70" />
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <Button size="lg" className="w-full text-lg shadow-lg hover:shadow-xl transition-all" onClick={handleCalculate}>
                                Przelicz Składkę
                            </Button>
                        </div>

                        {errors.length > 0 && (
                            <div className="md:col-span-2 bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <ul>
                                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>

            {/* Sidebar / Result Section */}
            <div className="space-y-6">
                <Card className="premium-card sticky top-6 border-primary/20 shadow-xl overflow-hidden">
                    <div className="bg-primary/10 p-4 border-b border-primary/10">
                        <h2 className="font-bold text-lg text-primary">Podsumowanie</h2>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        {!result ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Wprowadź dane i przelicz ofertę, aby zobaczyć wynik.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Wiek Pojazdu:</span>
                                        <span className="font-medium">{result.wiekPoczatkowy} lat</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Okres polisy:</span>
                                        <span className="font-medium">{formatDuration(result.latCalkowite)}</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-medium text-lg">Składka Łączna</span>
                                        <span className="font-extrabold text-2xl text-primary">{formatCurrency(result.skladkaCalkowita)} PLN</span>
                                    </div>
                                    <div className="flex justify-between items-baseline text-sm text-muted-foreground">
                                        <span>Miesięcznie (szacunek)</span>
                                        <span>{formatCurrency(result.kosztMiesieczny)} PLN</span>
                                    </div>
                                </div>

                                {/* Test Data Section */}
                                <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
                                    <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Dane testowe
                                    </div>
                                    <div className="p-3 text-xs text-gray-500 space-y-1 bg-white">
                                        {result.latT6Z > 0 && (
                                            <div className="flex justify-between border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                                <span>Taryfa T6Z ({formatDuration(result.latT6Z)}):</span>
                                                <span>{formatCurrency(result.skladkaT6Z)} PLN</span>
                                            </div>
                                        )}
                                        {result.latT10Z > 0 && (
                                            <div className="flex justify-between border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                                <span>Taryfa T10Z ({formatDuration(result.latT10Z)}):</span>
                                                <span>{formatCurrency(result.skladkaT10Z)} PLN</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1 font-medium">
                                            <span>Wariant: {formData.opcjaUbez}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => handleGenerateDocument('deklaracja')} disabled={isGenerating}>
                                            {isGenerating ? 'Generowanie...' : 'Deklaracja (PDF)'}
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleIssueCertificate} disabled={isGenerating}>
                                            {isGenerating ? 'Wystawianie...' : 'Wystaw Certyfikat'}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-1/2"
                                            onClick={handleDownloadXML}
                                            disabled={isSending || !issuedNumber}
                                            title={!issuedNumber ? "Musisz najpierw wystawić certyfikat" : ""}
                                        >
                                            Pobierz XML
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="w-1/2 gap-2"
                                            onClick={handleSendXML}
                                            disabled={isSending || !issuedNumber}
                                            title={!issuedNumber ? "Musisz najpierw wystawić certyfikat" : ""}
                                        >
                                            <Send className="h-4 w-4" /> Wyślij (SFTP)
                                        </Button>
                                    </div>
                                    {!issuedNumber && (
                                        <p className="text-xs text-red-500 text-center mt-1">
                                            Aby pobrać/wysłać XML, najpierw wystaw certyfikat.
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground text-center mt-2">Dla PDF używamy nowej technologii wektorowej.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Global Modal */}
            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                type={modal.type}
                actions={
                    modal.onConfirm ? (
                        <>
                            <Button variant="outline" onClick={closeModal}>Anuluj</Button>
                            <Button
                                className={modal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                                onClick={modal.onConfirm}
                            >
                                {modal.confirmText || 'Potwierdź'}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={closeModal}>Zamknij</Button>
                    )
                }
            >
                {modal.content}
            </Modal>
        </div>
    )
}
