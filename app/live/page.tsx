'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XEmbed } from '@/components/x-embed';

export default function LivePage() {
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = params.get('url');
      if (u) setUrl(u);
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="scanlines">
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                <span className="glow-cyan">LIVE</span>{' '}
                <span className="glow-pink">STREAM</span>
              </h1>
              <p className="text-gray-400 text-sm">Paste your X (Twitter) live URL, YouTube video, or pass it via ?url=...</p>
            </div>

            <Card className="bg-[#1B1B1B] border-[#00FFFF]/30">
              <CardContent className="pt-6 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://x.com/i/broadcasts/... or https://x.com/username/status/... or https://youtube.com/watch?v=..."
                    className="bg-[#0F0F0F] border-[#00FFFF]/30 focus:border-[#00FFFF] text-white"
                  />
                  <Button onClick={() => setUrl(url)} className="bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron">Load</Button>
                </div>

                {url ? (
                  <div className="mt-4">
                    <XEmbed url={url} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Enter a valid X or YouTube URL to embed the content.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}


