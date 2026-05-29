"use client";

import CalculatorComponent from "@/components/Calculator";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user?.role === 'ROZLICZENIA') {
      router.push('/stats');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">


      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Kalkulator Składek</h2>
          <p className="text-muted-foreground text-lg">Wprowadź dane pojazdu i partnera, aby wyliczyć składkę i wygenerować dokumenty.</p>
        </div>

        <CalculatorComponent />

      </div>
    </main>
  );
}
