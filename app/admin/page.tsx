"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pdf } from '@react-pdf/renderer';
import { CertificateDocument } from '@/components/documents/CertificateDocument';

interface Certificate {
    id: number;
    numerCertyfikatu: string;
    numerUmowy: string;
    daneKlienta: string; // JSON
    dataWystawienia: string;
    // Client-side parsed fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsedData?: any;
}

export default function AdminPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [stats, setStats] = useState({
        monthCount: 0,
        monthPremium: 0,
        variants: [] as { name: string; value: number }[]
    });

    useEffect(() => {
        fetchCertificates();
    }, []); // Initial load

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('startDate', dateFrom);
            if (dateTo) params.append('endDate', dateTo);

            const res = await fetch(`/api/certificates?${params.toString()}`);
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

    const handleBulkDownload = async () => {
        if (selectedIds.length === 0) return;
        try {
            const res = await fetch('/api/certificates/bulk-xml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `xml_export_${new Date().toISOString()}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (e) {
            alert('Błąd generowania ZIP');
        }
    };


    const handleDownloadSingle = async (cert: Certificate) => {
        try {
            if (!cert.parsedData) return;

            const formData = cert.parsedData;
            // Mock result object since we only stored 'skladka' inside formData
            const result = {
                skladkaCalkowita: formData.skladka,
                skladkaAssistance: 0,
                skladkaOC: 0,
                skladkaNNW: 0
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const doc = <CertificateDocument
                formData={formData}
                result={result as any}
                issuedNumber={cert.numerCertyfikatu}
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

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === certificates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(certificates.map(c => c.id));
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Panel Administratora</h1>
                    </div>
                    {/* Bulk Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleBulkDownload}
                            disabled={selectedIds.length === 0}
                            className="bg-primary text-white"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Pobierz XML (ZIP) ({selectedIds.length})
                        </Button>
                    </div>
                </div>

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
                            <p className="text-3xl font-bold mt-2 text-green-600">{stats.monthPremium.toFixed(2)} PLN</p>
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
                    <CardContent className="pt-6 flex gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium mb-1">Data Od</label>
                            <input
                                type="date"
                                className="border rounded p-2"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Data Do</label>
                            <input
                                type="date"
                                className="border rounded p-2"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchCertificates} variant="secondary">Filtruj</Button>
                        <Button onClick={() => { setDateFrom(''); setDateTo(''); fetchCertificates(); }} variant="outline">Reset</Button>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="bg-white rounded-md shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input type="checkbox" onChange={toggleAll} checked={selectedIds.length === certificates.length && certificates.length > 0} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr Certyfikatu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wariant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Składka</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Wystawienia</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Ładowanie...</td></tr>
                            ) : certificates.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Brak polis</td></tr>
                            ) : (
                                certificates.map(cert => (
                                    <tr key={cert.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(cert.id)}
                                                onChange={() => toggleSelect(cert.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{cert.numerCertyfikatu}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{cert.parsedData?.firmaName}</div>
                                            <div className="text-sm text-gray-500">NIP: {cert.parsedData?.firmaNIP}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{cert.parsedData?.opcjaUbez}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{cert.parsedData?.skladka ? `${cert.parsedData.skladka} PLN` : '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(cert.dataWystawienia).toLocaleDateString('pl-PL')}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleDownloadSingle(cert)} title="Pobierz PDF">
                                                <Download className="h-4 w-4 text-gray-600" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
