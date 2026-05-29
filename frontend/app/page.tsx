"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { apiFetch } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        monthCount: 0,
        monthPremium: 0,
        monthCommission: 0,
        variants: [] as { name: string; value: number }[],
        variantsPremium: [] as { name: string; value: number }[]
    });
    const [loading, setLoading] = useState(true);
    
    // Default to current year-month
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch products to get commission rates
            const prodRes = await apiFetch('/api/products');
            const products = prodRes.ok ? await prodRes.json() : [];
            const prodMap: Record<string, any> = {};
            products.forEach((p: any) => {
                prodMap[p.name] = p;
            });

            // 2. Fetch certificates for the selected month
            // We can fetch all and filter locally, or pass date filters. 
            // The existing backend supports `from` and `to`. Let's build `from` and `to` based on `selectedMonth`
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]) - 1; // 0-indexed
            
            const fromDate = new Date(year, month, 1);
            const toDate = new Date(year, month + 1, 0); // last day of month

            const fromStr = fromDate.toISOString().split('T')[0];
            const toStr = toDate.toISOString().split('T')[0];

            const res = await apiFetch(`/api/certificates?from=${fromStr}&to=${toStr}`);
            if (!res.ok) throw new Error('Failed to fetch certificates');
            const certs = await res.json();

            let mCount = 0;
            let mPremium = 0;
            let mCommission = 0;
            const variantMap: Record<string, number> = {};
            const variantPremiumMap: Record<string, number> = {};

            certs.forEach((cert: any) => {
                let d: any = {};
                try { d = JSON.parse(cert.daneKlienta); } catch { }

                const certPremium = Number(d.skladka || 0);
                mCount++;
                mPremium += certPremium;

                // Calculate Commission
                const latT6Z = Number(d.latT6Z || 0);
                const latT10Z = Number(d.latT10Z || 0);
                const variantName = d.opcjaUbez as string;

                if (variantName && prodMap[variantName]) {
                    const prod = prodMap[variantName];
                    const commT6Z = latT6Z * Number(prod.commissionT6Z || 0);
                    const commT10Z = latT10Z * Number(prod.commissionT10Z || 0);
                    mCommission += (commT6Z + commT10Z);
                }

                if (variantName) {
                    variantMap[variantName] = (variantMap[variantName] || 0) + 1;
                    variantPremiumMap[variantName] = (variantPremiumMap[variantName] || 0) + certPremium;
                }
            });

            const variantsData = Object.keys(variantMap).map(k => ({ name: k, value: variantMap[k] })).filter(i => i.value > 0);
            const variantsPremiumData = Object.keys(variantPremiumMap).map(k => ({ name: k, value: variantPremiumMap[k] })).filter(i => i.value > 0);

            setStats({
                monthCount: mCount,
                monthPremium: mPremium,
                monthCommission: mCommission,
                variants: variantsData,
                variantsPremium: variantsPremiumData
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const formatCurrency = (amount: number | string) => {
        const num = Number(amount);
        if (isNaN(num)) return '-';
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return (
        <main className="min-h-screen bg-gray-50/50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Dashboard</h2>
                        <p className="text-muted-foreground text-lg">Statystyki sprzedaży i prowizji</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz miesiąc</label>
                        <input 
                            type="month" 
                            className="border-gray-300 rounded-md shadow-sm border p-2 focus:ring-primary focus:border-primary"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 text-center">Ładowanie statystyk...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <Card className="border-l-4 border-l-blue-500 shadow-sm">
                            <CardContent className="pt-6">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase">Wystawione polisy</h3>
                                <p className="text-3xl font-bold mt-2 text-blue-700">{stats.monthCount} szt.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500 shadow-sm">
                            <CardContent className="pt-6">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase">Przypis składki</h3>
                                <p className="text-3xl font-bold mt-2 text-green-700">{formatCurrency(stats.monthPremium)} PLN</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500 shadow-sm">
                            <CardContent className="pt-6">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase">Wygenerowana Prowizja</h3>
                                <p className="text-3xl font-bold mt-2 text-purple-700">{formatCurrency(stats.monthCommission)} PLN</p>
                            </CardContent>
                        </Card>

                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Wykres podziału sztuk */}
                            <Card className="border border-gray-200">
                                <CardHeader className="bg-gray-50/50 border-b pb-4">
                                    <CardTitle className="text-lg">Podział Wariantów (sztuki)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] pt-4">
                                    {stats.variants.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.variants}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {stats.variants.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [`${value} szt.`, 'Ilość']} />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">Brak danych</div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Wykres podziału składki */}
                            <Card className="border border-gray-200">
                                <CardHeader className="bg-gray-50/50 border-b pb-4">
                                    <CardTitle className="text-lg">Podział Wariantów (przypis składki)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] pt-4">
                                    {stats.variantsPremium.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.variantsPremium}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {stats.variantsPremium.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [`${formatCurrency(value as number)} PLN`, 'Składka']} />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">Brak danych</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
