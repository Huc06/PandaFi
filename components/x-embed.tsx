'use client';

import React from 'react';
import Script from 'next/script';

interface XEmbedProps {
  url: string;
  align?: 'left' | 'center' | 'right';
}

export function XEmbed({ url, align = 'center' }: XEmbedProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = React.useState<'tweet' | 'broadcast' | 'unknown'>('unknown');
  const [tweetId, setTweetId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Detect type
    try {
      const u = new URL(url);
      const path = u.pathname;
      if (/\/status\/(\d+)/.test(path)) {
        const id = path.match(/\/status\/(\d+)/)?.[1] || null;
        setTweetId(id);
        setMode('tweet');
      } else if (/^\/i\/broadcasts\//.test(path)) {
        setMode('broadcast');
        setTweetId(null);
      } else {
        setMode('unknown');
        setTweetId(null);
      }
    } catch {
      setMode('unknown');
      setTweetId(null);
    }
  }, [url]);

  React.useEffect(() => {
    const render = async () => {
      try {
        // @ts-ignore
        if (mode === 'tweet' && window.twttr && window.twttr.widgets && ref.current) {
          ref.current.innerHTML = '';
          if (tweetId) {
            // @ts-ignore
            await window.twttr.widgets.createTweet(tweetId, ref.current, { align: 'center', theme: 'dark' });
          }
        }
      } catch {}
    };
    render();
  }, [url, mode, tweetId]);

  const justify = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className={`w-full flex ${justify}`}>
      {/* Load X (Twitter) widgets */}
      <Script id="x-widgets" src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
      <div className="w-full max-w-3xl">
        {mode === 'broadcast' ? (
          <iframe
            src={`https://twitframe.com/show?url=${encodeURIComponent(url)}`}
            className="w-full aspect-video rounded border border-[#00FFFF]/30"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div ref={ref} />
        )}
        {mode === 'unknown' && (
          <p className="text-xs text-gray-500 mt-2">Unsupported URL. Use a Tweet URL (/status/123...) or Broadcast URL (/i/broadcasts/...)</p>
        )}
      </div>
    </div>
  );
}


