"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { apiFetch } from '@/lib/api';
import { Download, FileSignature } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pdf } from '@react-pdf/renderer';
import { CertificateDocument } from '@/components/documents/CertificateDocument';
import { SignedDeclarationDocument } from '@/components/documents/SignedDeclarationDocument';

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

export default function StatsPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const dateToRef = useRef<HTMLInputElement>(null);

    const [stats, setStats] = useState({
        monthCount: 0,
        monthPremium: 0,
        variants: [] as { name: string; value: number }[]
    });

    const [agents, setAgents] = useState<{ id: number, username: string }[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [isAdminOrBilling, setIsAdminOrBilling] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                if (u.role === 'ADMIN' || u.role === 'ROZLICZENIA') {
                    setIsAdminOrBilling(true);
                    apiFetch('/api/users/agents')
                        .then(res => res.json())
                        .then(data => {
                            if (Array.isArray(data)) setAgents(data);
                        })
                        .catch(() => {});
                }
            } catch (e) {}
        }
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('from', dateFrom);
            if (dateTo) params.append('to', dateTo);
            if (selectedAgentId) params.append('agentId', selectedAgentId);

            const res = await apiFetch(`/api/certificates?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data: Certificate[] = await res.json();

            // Parse JSON data and Calculate Stats
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            let mCount = 0;
            let mPremium = 0;
            const variantMap: Record<string, number> = { 'Basic': 0, 'Top': 0, 'Best+': 0 };

            const parsed = data.map(cert => {
                let d = {};
                try { d = JSON.parse(cert.daneKlienta); } catch { }

                const date = new Date(cert.dataWystawienia);
                // Monthly Stats
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    mCount++;
                    // @ts-ignore
                    mPremium += Number(d.skladka || 0);
                }

                // Variant Stats
                // @ts-ignore
                const v = d.opcjaUbez as string;
                if (v && variantMap[v] !== undefined) {
                    variantMap[v]++;
                } else if (v) {
                    variantMap[v] = (variantMap[v] || 0) + 1;
                }

                return { ...cert, parsedData: d };
            });

            const variantsData = Object.keys(variantMap).map(k => ({ name: k, value: variantMap[k] })).filter(i => i.value > 0);

            setCertificates(parsed);
            setStats({
                monthCount: mCount,
                monthPremium: mPremium,
                variants: variantsData
            });

        } catch (error) {
            console.error(error);
            alert('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSingle = async (cert: Certificate) => {
        try {
            if (!cert.parsedData) return;

            const formData = cert.parsedData;
            // Mock result object
            const result = {
                skladkaCalkowita: formData.skladka,
                skladkaAssistance: 0,
                skladkaOC: 0,
                skladkaNNW: 0,
                latCalkowite: formData.periodDuration ? parseInt(formData.periodDuration) / 12 : 1
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const doc = <CertificateDocument
                formData={formData}
                result={result as any}
                issuedNumber={cert.numerCertyfikatu}
                signatureUrl={cert.user?.signatureUrl}
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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const formatCurrency = (amount: number | string) => {
        const num = Number(amount);
        if (isNaN(num)) return '-';
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Statystyki i dokumenty</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Sprzedaż (Bieżący Miesiąc)</h3>
                        <p className="text-3xl font-bold mt-2">{stats.monthCount} szt.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Składka (Bieżący Miesiąc)</h3>
                        <p className="text-3xl font-bold mt-2 text-green-600">{formatCurrency(stats.monthPremium)} PLN</p>
                    </CardContent>
                </Card>
                <Card className="md:row-span-2">
                    <CardHeader>
                        <CardTitle>Podział Wariantów</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        {stats.variants.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.variants}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.variants.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-400 mt-10">Brak danych</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
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
                                className="border rounded-md px-3 py-2 text-sm max-w-[200px]"
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

            {/* Table */}
            <div className="bg-white rounded-md shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr Certyfikatu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprzedawca</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wariant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Składka</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Wystawienia</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pobierz</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-4 text-center">Ładowanie...</td></tr>
                        ) : certificates.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-4 text-center">Brak polis</td></tr>
                        ) : (
                            certificates.map(cert => (
                                <tr key={cert.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{cert.numerCertyfikatu}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{cert.parsedData?.firmaName}</div>
                                        <div className="text-sm text-gray-500">NIP: {cert.parsedData?.firmaNIP}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{cert.user?.username || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{cert.parsedData?.opcjaUbez?.toUpperCase()}</td>
                                    <td className="px-6 py-4 text-sm font-medium">{cert.parsedData?.skladka ? `${formatCurrency(cert.parsedData.skladka)} PLN` : '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(cert.dataWystawienia).toLocaleDateString('pl-PL')}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadSingle(cert)} title="Pobierz PDF (Certyfikat)">
                                            <Download className="h-5 w-5 text-indigo-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadSignedDeclaration(cert)} title="Pobierz Podpisaną Deklarację">
                                            <FileSignature className="h-5 w-5 text-purple-600" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
