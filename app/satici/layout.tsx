import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Satıcı Paneli | Piinti',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SaticiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
