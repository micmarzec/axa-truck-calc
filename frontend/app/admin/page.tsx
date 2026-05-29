"use client"

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/api';
import { ProductsTab } from '@/components/admin/ProductsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { DocumentsTab } from '@/components/admin/DocumentsTab';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'users' | 'documents'>('products');
    const router = useRouter();

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser || currentUser.role !== 'ADMIN') {
            router.push('/');
        }
    }, [router]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    Panel Administratora
                </h1>
            </div>

            {/* TABS */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'products' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Zarządzanie Produktami
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'users' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Zarządzanie Użytkownikami
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'documents' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Dokumenty Globalne
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT */}
            <div className="pt-4">
                {activeTab === 'products' && <ProductsTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'documents' && <DocumentsTab />}
            </div>
        </div>
    );
}
