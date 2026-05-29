"use client"

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiFetch, getUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { History, FileText, CheckCircle, AlertCircle, Clock, ExternalLink, Download, FileSignature } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';
import { CertificateDocument } from '@/components/documents/CertificateDocument';
import { SignedDeclarationDocument } from '@/components/documents/SignedDeclarationDocument';

interface Calculation {
    id: number;
    groupId: string;
    version: number;
    daneKlienta: string; // JSON
    wynikKalkulacji: string; // JSON
    userId: number;
    createdAt: string;
    validUntil: string;
    user: { username: string };
    certificates: { id: number }[];
}

interface Certificate {
    id: number;
    numerCertyfikatu: string;
    numerUmowy: string;
    daneKlienta: string; // JSON
    dataWystawienia: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsedData?: any;
    user?: {
        signatureUrl?: string;
        username?: string;
    };
}

export default function HistoryPage() {
    const [activeTab, setActiveTab] = useState<'calculations' | 'certificates'>('calculations');
    
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Certificate Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const dateToRef = useRef<HTMLInputElement>(null);
    const [agents, setAgents] = useState<{ id: number, username: string }[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [isAdminOrBilling, setIsAdminOrBilling] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/login');
            return;
        }

        if (currentUser.role === 'ADMIN' || currentUser.role === 'ROZLICZENIA') {
            setIsAdminOrBilling(true);
            apiFetch('/api/users/agents')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAgents(data);
                })
                .catch(() => {});
        }

        apiFetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(console.error);

        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch Calculations
            const resCalc = await apiFetch('/api/calculations');
            if (resCalc.ok) {
                const data = await resCalc.json();
                setCalculations(data);
            }

            // Fetch Certificates
            await fetchCertificates();
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('from', dateFrom);
            if (dateTo) params.append('to', dateTo);
            if (selectedAgentId) params.append('agentId', selectedAgentId);

            const resCert = await apiFetch(`/api/certificates?${params.toString()}`);
            if (resCert.ok) {
                const data = await resCert.json();
                const parsed = data.map((cert: any) => {
                    let d = {};
                    try { d = JSON.parse(cert.daneKlienta); } catch { }
                    return { ...cert, parsedData: d };
                });
                setCertificates(parsed);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isCalculationInvalid = (calc: Calculation) => {
        if (new Date() > new Date(calc.validUntil)) return true;
        const hasCertificateInGroup = calculations.some(c => c.groupId === calc.groupId && c.certificates && c.certificates.length > 0);
        return hasCertificateInGroup;
    };

    const handleDownloadSingle = async (cert: Certificate) => {
        try {
            if (!cert.parsedData) return;
            const formData = cert.parsedData;
            const result = {
                skladkaCalkowita: formData.skladka,
                skladkaAssistance: 0,
                skladkaOC: 0,
                skladkaNNW: 0,
                latCalkowite: formData.periodDuration ? parseInt(formData.periodDuration) / 12 : 1
            };

            const doc = <CertificateDocument
                formData={formData}
                result={result as any}
                issuedNumber={cert.numerCertyfikatu}
                signatureUrl={cert.user?.signatureUrl}
                settings={settings}
            />;

            const blob = await pdf(doc).toBlob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanNum = cert.numerCertyfikatu.replace(/\//g, '_');
            a.download = `Certyfikat_${cleanNum}.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            document.body.removeChild(a);

        } catch (e) {
            console.error(e);
            alert('Błąd generowania PDF');
        }
    };

    const handleDownloadSignedDeclaration = async (cert: Certificate) => {
        try {
            if (!cert.parsedData) return;
            const formData = cert.parsedData;
            const result = {
                skladkaCalkowita: formData.skladka,
                skladkaAssistance: 0,
                skladkaOC: 0,
                skladkaNNW: 0,
                latCalkowite: formData.periodDuration ? parseInt(formData.periodDuration) / 12 : 1
            };

            const doc = <SignedDeclarationDocument
                formData={formData}
                result={result as any}
                signatureUrl={cert.user?.signatureUrl}
            />;

            const blob = await pdf(doc).toBlob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanNum = cert.numerCertyfikatu.replace(/\//g, '_');
            a.download = `Podpisana_Deklaracja_${cleanNum}.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            document.body.removeChild(a);

        } catch (e) {
            console.error(e);
            alert('Błąd generowania PDF');
        }
    };

    const formatCurrency = (amount: number | string) => {
        const num = Number(amount);
        if (isNaN(num)) return '-';
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    if (loading && calculations.length === 0 && certificates.length === 0) return <div className="p-10 text-center">Ładowanie historii...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <History className="h-8 w-8 text-primary" />
                    Historia i Dokumenty
                </h1>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* TABS */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('calculations')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'calculations' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Kalkulacje ({calculations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('certificates')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'certificates' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Certyfikaty ({certificates.length})
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT: CALCULATIONS */}
            {activeTab === 'calculations' && (
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Wykonane kalkulacje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Wersja</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Ważna do</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Użytkownik</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Firma</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Pojazd</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Wariant</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-right">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {calculations.map(c => {
                                        const isInvalid = isCalculationInvalid(c);
                                        let firma = "Brak";
                                        let pojazd = "Brak";
                                        let wariant = "Brak";
                                        try {
                                            const dane = JSON.parse(c.daneKlienta);
                                            firma = dane.firmaName || "Brak";
                                            pojazd = `${dane.pojazdMarka} ${dane.pojazdModel}`.trim() || "Brak";
                                            wariant = dane.opcjaUbez || "Brak";
                                        } catch (e) {}

                                        return (
                                            <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isInvalid ? 'opacity-50 grayscale bg-gray-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">#{c.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">v{c.version}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(c.validUntil).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{c.user?.username}</td>
                                                <td className="px-6 py-4 font-medium">{firma}</td>
                                                <td className="px-6 py-4 text-gray-600">{pojazd}</td>
                                                <td className="px-6 py-4 font-medium text-primary">{wariant}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="gap-2"
                                                        onClick={() => router.push(`/calculator?calcId=${c.id}`)}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Otwórz
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {calculations.length === 0 && !loading && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Brak historii kalkulacji.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: CERTIFICATES */}
            {activeTab === 'certificates' && (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        if (e.target.value) {
                                            setTimeout(() => {
                                                try { dateToRef.current?.showPicker(); } catch (err) {}
                                            }, 100);
                                        }
                                    }}
                                    className="max-w-[200px]"
                                />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    ref={dateToRef}
                                    className="max-w-[200px]"
                                />
                                {isAdminOrBilling && (
                                    <select
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm max-w-[200px] focus:ring-primary focus:border-primary"
                                        value={selectedAgentId}
                                        onChange={(e) => setSelectedAgentId(e.target.value)}
                                    >
                                        <option value="">Wszyscy sprzedawcy</option>
                                        {agents.map(a => (
                                            <option key={a.id} value={a.id}>{a.username}</option>
                                        ))}
                                    </select>
                                )}
                                <Button onClick={fetchCertificates} variant="secondary">Filtruj</Button>
                                <Button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedAgentId(''); fetchCertificates(); }} variant="outline">Reset</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Nr Certyfikatu</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Klient</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Sprzedawca</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Wariant</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Składka</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Data Wystawienia</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider">Pobierz</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {certificates.length === 0 && !loading ? (
                                            <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Brak polis spełniających kryteria.</td></tr>
                                        ) : (
                                            certificates.map(cert => (
                                                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{cert.numerCertyfikatu}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{cert.parsedData?.firmaName}</div>
                                                        <div className="text-gray-500">NIP: {cert.parsedData?.firmaNIP}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">{cert.user?.username || '-'}</td>
                                                    <td className="px-6 py-4 text-gray-500">{cert.parsedData?.opcjaUbez?.toUpperCase()}</td>
                                                    <td className="px-6 py-4 font-medium">{cert.parsedData?.skladka ? `${formatCurrency(cert.parsedData.skladka)} PLN` : '-'}</td>
                                                    <td className="px-6 py-4 text-gray-500">{new Date(cert.dataWystawienia).toLocaleDateString('pl-PL')}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleDownloadSingle(cert)} title="Pobierz PDF (Certyfikat)">
                                                                <Download className="h-4 w-4 text-indigo-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDownloadSignedDeclaration(cert)} title="Pobierz Podpisaną Deklarację">
                                                                <FileSignature className="h-4 w-4 text-purple-600" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
