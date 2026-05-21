import CalculatorComponent from "@/components/Calculator";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Pekao Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pekao_logo.png" alt="Pekao Leasing" className="h-12 w-auto object-contain" />

            <div className="hidden md:block h-8 w-px bg-gray-200"></div>

            <div className="hidden md:block">
              <h1 className="font-bold text-xl leading-none tracking-tight text-gray-900">Truck Assistance dla Klientów Pekao Leasing</h1>
              <p className="text-xs text-muted-foreground font-medium">System Obsługi Produktu</p>
            </div>
          </div>

          {/* AXA Logo */}
          <div className="flex items-center gap-4">
            <Link href="/admin">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/axa_logo.png" alt="AXA" className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
          </div>
        </div>
      </header>

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
