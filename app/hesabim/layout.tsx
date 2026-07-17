import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hesabım | Piinti',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HesabimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
