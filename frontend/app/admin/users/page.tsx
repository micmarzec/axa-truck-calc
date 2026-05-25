"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch, getUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Primitives';
import { ArrowLeft, UserPlus, Users, AlertCircle, UploadCloud, Key, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface User {
    id: number;
    username: string;
    role: string;
    signatureUrl?: string;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
    const [newAdminPassword, setNewAdminPassword] = useState('');
    
    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUser = getUser();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'ADMIN') {
            window.location.href = '/';
            return;
        }
        fetchUsers();
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const res = await apiFetch('/api/users');
            if (!res.ok) throw new Error('Błąd pobierania użytkowników');
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const res = await apiFetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Błąd tworzenia użytkownika');
            }

            // Reset form and refresh list
            setUsername('');
            setPassword('');
            setRole('USER');
            fetchUsers();
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, userId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'image/png') {
            alert('Proszę wybrać plik w formacie PNG.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const img = new window.Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const base64Image = canvas.toDataURL('image/png');
                    
                    try {
                        const res = await apiFetch(`/api/users/${userId}/signature`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ base64Image })
                        });

                        if (!res.ok) throw new Error('Nie udało się wgrać podpisu');
                        
                        alert('Podpis wgrany pomyślnie!');
                        fetchUsers(); // Refresh list
                    } catch (err: any) {
                        alert(err.message);
                    }
                }
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            const res = await apiFetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Błąd usuwania');
            }
            alert('Użytkownik usunięty');
            fetchUsers();
            setDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToChangePassword) return;
        try {
            const res = await apiFetch(`/api/users/${userToChangePassword.id}/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: newAdminPassword })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Błąd zmiany hasła');
            }
            alert('Hasło zostało zmienione');
            setPasswordModalOpen(false);
            setUserToChangePassword(null);
            setNewAdminPassword('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-10 text-center">Ładowanie...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    Zarządzanie Użytkownikami
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Form Column */}
                <div className="md:col-span-1">
                    <Card className="border-primary/20 sticky top-6">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                <UserPlus className="h-5 w-5" />
                                Dodaj Użytkownika
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nazwa użytkownika (Login)</label>
                                    <Input 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        required 
                                        placeholder="np. jkowalski" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hasło</label>
                                    <Input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rola</label>
                                    <Select value={role} onChange={(e) => setRole(e.target.value)}>
                                        <option value="USER">Sprzedawca (USER)</option>
                                        <option value="ADMIN">Administrator (ADMIN)</option>
                                        <option value="ROZLICZENIA">Rozliczenia (ROZLICZENIA)</option>
                                    </Select>
                                </div>

                                {error && (
                                    <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2 text-sm">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Tworzenie...' : 'Utwórz konto'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* List Column */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Zarejestrowani Użytkownicy ({users.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-4 font-semibold border-b">ID</th>
                                            <th className="p-4 font-semibold border-b">Użytkownik</th>
                                            <th className="p-4 font-semibold border-b">Rola</th>
                                            <th className="p-4 font-semibold border-b">Podpis</th>
                                            <th className="p-4 font-semibold border-b">Utworzono</th>
                                            <th className="p-4 font-semibold border-b text-right">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                                                <td className="p-4 text-gray-500">#{u.id}</td>
                                                <td className="p-4 font-medium">{u.username}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                                                        u.role === 'ROZLICZENIA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {u.signatureUrl ? (
                                                        <img 
                                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${u.signatureUrl}`} 
                                                            alt="Podpis" 
                                                            className="h-10 object-contain rounded border bg-white p-1" 
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">Brak</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-500">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <label 
                                                        className="cursor-pointer inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-md transition-colors"
                                                        title="Wgraj podpis (PNG)"
                                                    >
                                                        <UploadCloud className="w-4 h-4" />
                                                        <input 
                                                            type="file" 
                                                            accept="image/png" 
                                                            className="hidden" 
                                                            onChange={(e) => handleFileUpload(e, u.id)} 
                                                        />
                                                    </label>
                                                    
                                                    <button
                                                        onClick={() => { setUserToChangePassword(u); setPasswordModalOpen(true); }}
                                                        className="inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 w-8 h-8 rounded-md transition-colors"
                                                        title="Zmień hasło"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => { setUserToDelete(u); setDeleteModalOpen(true); }}
                                                        className="inline-flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 w-8 h-8 rounded-md transition-colors"
                                                        title="Usuń użytkownika"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        Brak innych użytkowników.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={deleteModalOpen} 
                onClose={() => { setDeleteModalOpen(false); setUserToDelete(null); }} 
                title="Usuń użytkownika"
                type="danger"
                actions={
                    <>
                        <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setUserToDelete(null); }}>Anuluj</Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>Usuń bezpowrotnie</Button>
                    </>
                }
            >
                Czy na pewno chcesz usunąć użytkownika <strong>{userToDelete?.username}</strong>? Tej operacji nie można cofnąć.
            </Modal>

            {/* Change Password Modal */}
            <Modal 
                isOpen={passwordModalOpen} 
                onClose={() => { setPasswordModalOpen(false); setUserToChangePassword(null); setNewAdminPassword(''); }} 
                title={`Zmień hasło dla: ${userToChangePassword?.username}`}
                type="default"
                actions={
                    <>
                        <Button variant="outline" onClick={() => { setPasswordModalOpen(false); setUserToChangePassword(null); setNewAdminPassword(''); }}>Anuluj</Button>
                        <Button onClick={handleChangePassword}>Zapisz hasło</Button>
                    </>
                }
            >
                <form id="changePasswordForm" onSubmit={handleChangePassword} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nowe hasło</label>
                        <Input 
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Wpisz nowe hasło..."
                            required
                        />
                    </div>
                </form>
            </Modal>

        </div>
    );
}
