import './globals.css';
import type { Metadata } from 'next';
import { Orbitron, Exo_2 } from 'next/font/google';
import { Providers } from '@/components/providers';

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900']
});

const exo = Exo_2({ 
  subsets: ['latin'],
  variable: '--font-exo',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'SocialFi dApp - Built with ChatAndBuild',
  description: 'A decentralized social finance platform with Web3 integration',
  keywords: 'no-code, app builder, conversation-driven development, socialfi, web3, blockchain, dapp',
  openGraph: {
    title: 'SocialFi dApp - Built with ChatAndBuild',
    description: 'A decentralized social finance platform with Web3 integration',
    images: ['https://cdn.chatandbuild.com/images/preview.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SocialFi dApp - Built with ChatAndBuild',
    description: 'A decentralized social finance platform with Web3 integration',
    images: ['https://cdn.chatandbuild.com/images/preview.png'],
    site: '@chatandbuild',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${exo.variable} font-exo bg-[#0F0F0F] text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
