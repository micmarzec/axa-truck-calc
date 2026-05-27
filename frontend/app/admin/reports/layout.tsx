import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Raporty systemowe',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
