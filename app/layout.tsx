import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyChat - AI Powered Messaging',
  description: 'Private messaging platform with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
