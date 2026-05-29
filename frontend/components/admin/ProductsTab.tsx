"use client"

import React, { useState, useEffect } from 'react';
import { apiFetch, getUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PackageSearch, AlertCircle, Edit, FileText, Trash2, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface Product {
    id: number;
    name: string;
    code: string;
    priceT6Z: number;
    priceT10Z: number;
    commissionT6Z: number;
    commissionT10Z: number;
    active: boolean;
}

    validFrom: string;
    validTo: string | null;
}

export function ProductsTab() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [formState, setFormState] = useState({
        priceT6Z: 0,
        priceT10Z: 0,
        commissionT6Z: 0,
        commissionT10Z: 0,
        active: true,
        validFrom: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUser = getUser();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'ADMIN') {
            window.location.href = '/';
            return;
        }
        fetchProducts();
    }, [currentUser]);

    const fetchProducts = async () => {
        try {
            const res = await apiFetch('/api/products');
            if (!res.ok) throw new Error('Błąd pobierania produktów');
            const data = await res.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setFormState({
            priceT6Z: product.priceT6Z,
            priceT10Z: product.priceT10Z,
            commissionT6Z: product.commissionT6Z,
            commissionT10Z: product.commissionT10Z,
            active: product.active,
            validFrom: ''
        });
        setEditModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        
        setError('');
        setIsSubmitting(true);

        try {
            const res = await apiFetch(`/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Błąd aktualizacji produktu');
            }

            setEditModalOpen(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };



    if (loading) return <div className="p-10 text-center">Ładowanie...</div>;

    return (
        <div className="space-y-8 animate-fade-in">

            {error && !editModalOpen && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Dostępne warianty ubezpieczenia ({products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-4 font-semibold border-b">ID</th>
                                    <th className="p-4 font-semibold border-b">Nazwa Wariantu</th>
                                    <th className="p-4 font-semibold border-b">Składki (T6Z/T10Z)</th>
                                    <th className="p-4 font-semibold border-b">Prowizje (T6Z/T10Z)</th>
                                    <th className="p-4 font-semibold border-b">Okres Obowiązywania</th>
                                    <th className="p-4 font-semibold border-b">Status</th>
                                    <th className="p-4 font-semibold border-b text-right">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                                        <td className="p-4 text-gray-500">#{p.id}</td>
                                        <td className="p-4 font-medium text-primary">{p.name} <span className="text-xs text-gray-400">({p.code})</span></td>
                                        <td className="p-4 text-gray-600">{p.priceT6Z} / {p.priceT10Z} PLN</td>
                                        <td className="p-4 text-green-600 font-semibold">{p.commissionT6Z} / {p.commissionT10Z} PLN</td>
                                        <td className="p-4 text-xs text-gray-500">
                                            {new Date(p.validFrom).toLocaleDateString('pl-PL')} - {p.validTo ? new Date(p.validTo).toLocaleDateString('pl-PL') : 'Bezterminowo'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {p.active ? 'Aktywny' : 'Wyłączony'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleEditClick(p)}
                                                className="inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 w-8 h-8 rounded-md transition-colors"
                                                title="Edytuj produkt"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {products.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Brak zdefiniowanych produktów. Zgłoś problem techniczny.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Modal 
                isOpen={editModalOpen} 
                onClose={() => setEditModalOpen(false)} 
                title={`Nowa wersja taryfy: ${editingProduct?.name}`}
                actions={
                    <>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>Zamknij</Button>
                        <Button onClick={handleSaveProduct} disabled={isSubmitting}>
                            {isSubmitting ? 'Zapisywanie...' : 'Zapisz jako nową wersję'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6 pt-2 pb-6 max-h-[70vh] overflow-y-auto px-1">
                    <form id="editProductForm" onSubmit={handleSaveProduct} className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Parametry Cenowe</h3>
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2 text-sm mb-4">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Składka T6Z (PLN)</label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={formState.priceT6Z}
                                    onChange={(e) => setFormState({...formState, priceT6Z: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prowizja T6Z (PLN)</label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={formState.commissionT6Z}
                                    onChange={(e) => setFormState({...formState, commissionT6Z: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Składka T10Z (PLN)</label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={formState.priceT10Z}
                                    onChange={(e) => setFormState({...formState, priceT10Z: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prowizja T10Z (PLN)</label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    value={formState.commissionT10Z}
                                    onChange={(e) => setFormState({...formState, commissionT10Z: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data wejścia w życie nowej taryfy</label>
                                <Input 
                                    type="date"
                                    value={formState.validFrom}
                                    onChange={(e) => setFormState({...formState, validFrom: e.target.value})}
                                    required
                                />
                                <p className="text-xs text-gray-500">Utworzenie nowej wersji wygasi poprzednią taryfę z tą samą datą.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                checked={formState.active}
                                onChange={(e) => setFormState({...formState, active: e.target.checked})}
                                className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">
                                Produkt aktywny (widoczny w kalkulatorze)
                            </label>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
