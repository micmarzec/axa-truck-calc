"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, logout } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Primitives';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError('Nowe hasła nie są identyczne');
            return;
        }
        if (newPassword.length < 5) {
            setError('Nowe hasło musi mieć co najmniej 5 znaków');
            return;
        }

        setIsLoading(true);

        try {
            const res = await apiFetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Błąd zmiany hasła');
            }

            setSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            // Force re-login after 3 seconds
            setTimeout(() => {
                logout();
            }, 3000);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 animate-fade-in">
            <Card className="shadow-lg border-primary/10">
                <CardHeader>
                    <CardTitle className="text-2xl">Zmień hasło</CardTitle>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center py-8 space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                            <h3 className="text-xl font-bold text-green-700">Hasło zostało zmienione!</h3>
                            <p className="text-muted-foreground">Ze względów bezpieczeństwa nastąpi wylogowanie z systemu...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Obecne hasło</Label>
                                <Input 
                                    type="password" 
                                    value={oldPassword} 
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nowe hasło</Label>
                                <Input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Powtórz nowe hasło</Label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required 
                                />
                            </div>

                            {error && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2 text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                                {isLoading ? 'Aktualizowanie...' : 'Zmień hasło'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
