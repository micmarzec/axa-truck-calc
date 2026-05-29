"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Primitives';
import { apiFetch, getUser } from '@/lib/api';
import { FileDown, FileText, Send, CheckCircle2, XCircle, FileSignature, Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { pdf } from '@react-pdf/renderer';
import { SignedDeclarationDocument } from '@/components/documents/SignedDeclarationDocument';
import { CertificateDocument } from '@/components/documents/CertificateDocument';

interface Certificate {
    id: number;
    numerCertyfikatu: string;
    numerUmowy: string;
    daneKlienta: string; // JSON
    dataWystawienia: string;
    xmlWyslany: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsedData?: any;
    user?: {
        username?: string;
        signatureUrl?: string;
    };
}

export default function ReportsPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const dateToRef = useRef<HTMLInputElement>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingSftpIds, setPendingSftpIds] = useState<number[]>([]);
    const [agents, setAgents] = useState<{ id: number, username: string }[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const user = getUser();

    useEffect(() => {
        const currentUser = getUser();
        if (currentUser && !['ADMIN', 'ROZLICZENIA'].includes(currentUser.role)) {
            window.location.href = '/stats';
            return;
        }
        
        apiFetch('/api/users/agents')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAgents(data);
            })
            .catch(() => {});

        fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            const parsed = data.map(cert => {
                let d = {};
                try { d = JSON.parse(cert.daneKlienta); } catch { }
                return { ...cert, parsedData: d };
            });

            setCertificates(parsed);
        } catch (error) {
            console.error(error);
            alert('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSingleXML = async (cert: Certificate) => {
        try {
            const res = await apiFetch(`/api/certificates/download-xml`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cert.id })
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanNum = cert.numerCertyfikatu.replace(/\//g, '_');
            a.download = `Contract_${cleanNum}.xml`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (e) {
            alert('Błąd generowania XML');
        }
    };

    const handleDownloadBulkXML = async (ids: number[]) => {
        try {
            const res = await apiFetch(`/api/certificates/bulk-xml`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificates_export_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Błąd generowania ZIP');
        }
    };

    const handleSendSFTP = async (ids: number[]) => {
        // Check if any is already sent
        const anySent = certificates.some(c => ids.includes(c.id) && c.xmlWyslany);
        if (anySent) {
            setPendingSftpIds(ids);
            setConfirmModalOpen(true);
            return;
        }
        await executeSFTPSend(ids);
    };

    const executeSFTPSend = async (ids: number[]) => {
        setConfirmModalOpen(false);
        try {
            const res = await apiFetch(`/api/certificates/bulk-send-sftp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error('Send failed');
            
            alert('Wysłano pomyślnie na SFTP!');
            fetchCertificates(); // Refresh status
            setSelectedIds([]); // Clear selection
        } catch (e) {
            alert('Błąd wysyłki SFTP');
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

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Raporty Systemowe</h1>

            {/* Filters & Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    if (e.target.value) {
                                        setTimeout(() => {
                                            try { dateToRef.current?.showPicker(); } catch (e) {}
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
                            <Button onClick={fetchCertificates} variant="secondary">Filtruj</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => handleDownloadBulkXML(selectedIds)} 
                                disabled={selectedIds.length === 0}
                                variant="outline"
                                className="flex gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                                <FileDown className="h-4 w-4" />
                                Pobierz zaznaczone XML ({selectedIds.length})
                            </Button>
                            <Button 
                                onClick={() => handleSendSFTP(selectedIds)} 
                                disabled={selectedIds.length === 0}
                                className="bg-green-600 hover:bg-green-700 text-white flex gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Wyślij zaznaczone na SFTP ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprzedawca</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wariant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Wystawienia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wysłane</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={8} className="px-6 py-4 text-center">Ładowanie...</td></tr>
                        ) : certificates.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-4 text-center">Brak polis w bazie</td></tr>
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
                                    <td className="px-6 py-4 text-sm text-gray-500">{cert.user?.username || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{cert.parsedData?.opcjaUbez?.toUpperCase()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(cert.dataWystawienia).toLocaleDateString('pl-PL')}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {cert.xmlWyslany ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <CheckCircle2 className="w-3 h-3" /> Przesłano
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <XCircle className="w-3 h-3" /> Oczekuje
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadSingle(cert)} title="Pobierz PDF (Certyfikat)">
                                            <Download className="h-5 w-5 text-indigo-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadSignedDeclaration(cert)} title="Pobierz Podpisaną Deklarację">
                                            <FileSignature className="h-5 w-5 text-purple-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadSingleXML(cert)} title="Pobierz XML lokalnie">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleSendSFTP([cert.id])} title="Wyślij na SFTP">
                                            <Send className={`h-5 w-5 ${cert.xmlWyslany ? 'text-gray-400' : 'text-green-600'}`} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal - Potwierdzenie Ponownej Wysyłki */}
            <Modal 
                isOpen={confirmModalOpen} 
                onClose={() => setConfirmModalOpen(false)} 
                title="Ponowna wysyłka SFTP"
                type="danger"
                actions={
                    <>
                        <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Anuluj</Button>
                        <Button variant="destructive" onClick={() => executeSFTPSend(pendingSftpIds)}>Wyślij ponownie</Button>
                    </>
                }
            >
                Te pliki zostały już wysłane na serwer Towarzystwa Ubezpieczeniowego. Czy na pewno chcesz je wysłać ponownie?
            </Modal>
        </div>
    );
}
