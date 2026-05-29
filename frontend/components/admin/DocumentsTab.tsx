import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Primitives';
import { FileText, AlertCircle, Trash2, Upload } from 'lucide-react';

interface GlobalDocument {
    id: number;
    type: string;
    fileUrl: string;
    validFrom: string;
    createdAt: string;
}

export function DocumentsTab() {
    const [documents, setDocuments] = useState<GlobalDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [uploadType, setUploadType] = useState('OWU_SWU');
    const [uploadDate, setUploadDate] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await apiFetch('/api/documents');
            if (!res.ok) throw new Error('Błąd pobierania dokumentów');
            const data = await res.json();
            setDocuments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadDocument = async () => {
        if (!uploadFile || !uploadDate) {
            alert('Wybierz plik i określ datę obowiązywania.');
            return;
        }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('type', uploadType);
            formData.append('validFrom', uploadDate);

            const res = await apiFetch('/api/documents', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setUploadFile(null);
                setUploadDate('');
                fetchDocuments();
            } else {
                alert('Błąd wgrywania pliku');
            }
        } catch (e) {
            console.error(e);
            alert('Wystąpił błąd podczas wgrywania.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten dokument?')) return;
        try {
            const res = await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchDocuments();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center">Ładowanie...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wgrywanie */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                <Upload className="h-5 w-5" />
                                Wgraj Nowy Dokument
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Typ Dokumentu</label>
                                <Select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                                    <option value="OWU_SWU">OWU / SWU</option>
                                    <option value="IPID">IPID</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data wejścia w życie</label>
                                <Input 
                                    type="date" 
                                    value={uploadDate} 
                                    onChange={(e) => setUploadDate(e.target.value)} 
                                />
                                <p className="text-xs text-muted-foreground">Kalkulacje wykonane od tej daty otrzymają ten dokument przy wysyłce.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Plik (PDF)</label>
                                <Input 
                                    type="file" 
                                    accept=".pdf" 
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                                />
                            </div>
                            <Button 
                                onClick={handleUploadDocument} 
                                className="w-full" 
                                disabled={!uploadFile || !uploadDate || isUploading}
                            >
                                {isUploading ? 'Wgrywanie...' : 'Wgraj plik'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Lista */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historia Dokumentów</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-4 font-semibold border-b">Typ</th>
                                            <th className="p-4 font-semibold border-b">Data od</th>
                                            <th className="p-4 font-semibold border-b">Plik</th>
                                            <th className="p-4 font-semibold border-b text-right">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.length > 0 ? (
                                            documents.map(d => (
                                                <tr key={d.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-4 font-medium text-primary">
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                                            {d.type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {new Date(d.validFrom).toLocaleDateString('pl-PL')}
                                                    </td>
                                                    <td className="p-4">
                                                        <a href={`http://localhost:4000${d.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                            <FileText className="w-4 h-4" /> Pobierz
                                                        </a>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteDocument(d.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Usuń dokument"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                                    Brak wgranych dokumentów. Wgraj pliki OWU i IPID, aby móc wystawiać polisy.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
