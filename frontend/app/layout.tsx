import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Morning Dispatch — Your Chief of Staff',
  description:
    'A daily, opinionated brief for founders. Four sections. One artifact. Delivered at 7am.',
  openGraph: {
    title: 'The Morning Dispatch',
    description:
      'The brief your Chief of Staff would write. Every morning. Four sections. Never more.'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..900;1,9..144,200..900&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Manrope:wght@300..800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-reading antialiased relative">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
