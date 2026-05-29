import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Save } from 'lucide-react';

export function SettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const [formData, setFormData] = useState({
        partnerName: '',
        partnerRegistryData: '',
        xmlPartnerId: '',
        sftpHost: '',
        sftpPort: 22,
        sftpUser: '',
        sftpPassword: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiFetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    partnerName: data.partnerName || '',
                    partnerRegistryData: data.partnerRegistryData || '',
                    xmlPartnerId: data.xmlPartnerId || 'PEKAO_TA',
                    sftpHost: data.sftpHost || '',
                    sftpPort: data.sftpPort || 22,
                    sftpUser: data.sftpUser || '',
                    sftpPassword: data.sftpPassword || ''
                });
            } else {
                throw new Error('Błąd pobierania ustawień');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setSaving(true);

        try {
            const res = await apiFetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Błąd zapisywania ustawień');
            }

            setSuccessMsg('Ustawienia zostały pomyślnie zapisane.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Ładowanie...</div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            
            {successMsg && (
                <div className="bg-green-100 text-green-700 p-4 rounded-md flex items-start gap-2">
                    <Save className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Ustawienia Systemowe</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Konfiguracja parametrów wyświetlanych na dokumentach (Certyfikat, Deklaracja)
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nazwa Partnera (Krótka)</label>
                                <Input 
                                    value={formData.partnerName}
                                    onChange={(e) => setFormData({...formData, partnerName: e.target.value})}
                                    placeholder="np. Pekao Leasing"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Stosowana w tekstach takich jak "Partner [Nazwa] - Korzystający" czy nazwie programu (np. "[Nazwa] Truck Assistance").</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dane Rejestrowe Partnera / Ubezpieczającego</label>
                                <textarea 
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.partnerRegistryData}
                                    onChange={(e) => setFormData({...formData, partnerRegistryData: e.target.value})}
                                    placeholder="Pekao Leasing Sp. z o.o. z siedzibą w Warszawie..."
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Długi blok tekstu używany w deklaracjach określający podmiot z NIP, REGON i adresem.</p>
                            </div>
                        </div>

                        <div className="pt-4 mt-6 border-t">
                            <h3 className="text-lg font-medium mb-4 mt-4">Wysyłka plików XML (SFTP)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Identyfikator Partnera (tag XML: z / od)</label>
                                    <Input 
                                        value={formData.xmlPartnerId}
                                        onChange={(e) => setFormData({...formData, xmlPartnerId: e.target.value})}
                                        placeholder="np. PEKAO_TA"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Host serwera SFTP</label>
                                    <Input 
                                        value={formData.sftpHost}
                                        onChange={(e) => setFormData({...formData, sftpHost: e.target.value})}
                                        placeholder="np. sftp.partner.pl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Port SFTP</label>
                                    <Input 
                                        type="number"
                                        value={formData.sftpPort}
                                        onChange={(e) => setFormData({...formData, sftpPort: Number(e.target.value)})}
                                        placeholder="22"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Użytkownik (Login)</label>
                                    <Input 
                                        value={formData.sftpUser}
                                        onChange={(e) => setFormData({...formData, sftpUser: e.target.value})}
                                        placeholder="Użytkownik SFTP"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hasło (pozostaw puste by nie zmieniać)</label>
                                    <Input 
                                        type="password"
                                        value={formData.sftpPassword}
                                        onChange={(e) => setFormData({...formData, sftpPassword: e.target.value})}
                                        placeholder="Hasło SFTP"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Jeśli Host nie jest skonfigurowany, pliki będą wysyłane na systemowy (MOCK) serwer. Konfiguracja będzie użyta przy kliknięciu "Wyślij XML".</p>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
