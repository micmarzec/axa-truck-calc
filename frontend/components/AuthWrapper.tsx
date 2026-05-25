"use client"

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/api';
import { Button } from './ui/Button';
import Link from 'next/link';
import { Calculator, BarChart3, FileSpreadsheet, Users, KeyRound, LogOut } from 'lucide-react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const user = getUser();
        if (!user && pathname !== '/login') {
            router.push('/login');
        } else {
            setIsLoading(false);
        }
    }, [pathname, router]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
    }

    if (pathname === '/login') {
        return <>{children}</>;
    }

    const user = getUser();
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-6">
                            {/* Pekao Logo & Title */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/pekao_logo.png" alt="Pekao Leasing" className="h-14 w-auto object-contain" />
                            
                            <div className="hidden md:block h-8 w-px bg-gray-200"></div>

                            <div className="hidden md:block mr-4">
                                <h1 className="font-bold text-xl leading-none tracking-tight text-gray-900">Truck Assistance dla Klientów Pekao Leasing</h1>
                                <p className="text-xs text-muted-foreground font-medium">System Obsługi Produktu</p>
                            </div>
                            
                            {/* 4 KAFELKI NAWIGACYJNE - IKONY */}
                            <nav className="flex gap-3">
                                {user?.role !== 'ROZLICZENIA' && (
                                    <Link href="/">
                                        <Button variant={pathname === '/' ? 'default' : 'outline'} size="icon" className="h-12 w-12" title="Kalkulator">
                                            <Calculator className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                                <Link href="/stats">
                                    <Button variant={pathname === '/stats' ? 'default' : 'outline'} size="icon" className="h-12 w-12" title="Statystyki">
                                        <BarChart3 className="w-5 h-5" />
                                    </Button>
                                </Link>
                                
                                {(isAdmin || user?.role === 'ROZLICZENIA') && (
                                    <Link href="/admin/reports">
                                        <Button variant={pathname === '/admin/reports' ? 'default' : 'outline'} size="icon" className="h-12 w-12 border-primary/20 hover:bg-primary/5 text-blue-600" title="Raporty">
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                                
                                {isAdmin && (
                                    <Link href="/admin/users">
                                        <Button variant={pathname.startsWith('/admin/users') ? 'default' : 'outline'} size="icon" className="h-12 w-12 border-primary/20 hover:bg-primary/5 text-purple-600" title="Panel Administratora">
                                            <Users className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-semibold">{user?.username}</span>
                                <span className="text-xs text-muted-foreground">
                                    {isAdmin ? 'Administrator' : user?.role === 'ROZLICZENIA' ? 'Rozliczenia' : 'Sprzedawca'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border-l pl-4 ml-2">
                                <Link href="/change-password">
                                    <Button variant="ghost" size="icon" title="Zmień hasło">
                                        <KeyRound className="w-5 h-5 text-gray-500" />
                                    </Button>
                                </Link>
                                <Button variant="ghost" size="icon" onClick={logout} title="Wyloguj">
                                    <LogOut className="w-5 h-5 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
