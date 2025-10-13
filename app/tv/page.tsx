
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

function FeatureSimulator() {
  const countries = [
    'Global',
    'Vietnam',
    'United States',
    'Japan',
    'Korea',
    'France',
    'Germany',
  ];
  const genders = ['Any', 'Male', 'Female'];

  const [selectedCountry, setSelectedCountry] = useState('Global');
  const [selectedGender, setSelectedGender] = useState('Any');
  const [coupleMode, setCoupleMode] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [translationOn, setTranslationOn] = useState(true);
  const [inputText, setInputText] = useState('Hello! Nice to meet you.');
  const [outputText, setOutputText] = useState('Hello! Nice to meet you.');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setCameraError("Camera access was denied. Please enable camera access in your browser settings.");
        throw err; // re-throw to prevent connection
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    // Simulate thousands of users online
    const seed = () => 120000 + Math.floor(Math.random() * 60000);
    setOnlineUsers(seed());
    const id = setInterval(() => setOnlineUsers(seed()), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!sessionStart) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStart]);

  const formattedDuration = useMemo(() => {
    const h = Math.floor(sessionSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((sessionSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sessionSeconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [sessionSeconds]);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      await startCamera();
      // Simulate fast connection time
      setTimeout(() => {
        setConnecting(false);
        setConnected(true);
        setSessionStart(Date.now());
      }, 500);
    } catch (error) {
      // Camera access was denied or another error occurred
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    stopCamera();
    setConnected(false);
    setSessionStart(null);
    setSessionSeconds(0);
  };

  const handleNextPartner = () => {
    // Don't stop the camera, just simulate finding a new partner.
    setConnected(false);
    setSessionStart(null);
    setSessionSeconds(0);
    setConnecting(true);

    // Simulate finding a new partner
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      setSessionStart(Date.now());
    }, 600); // Same delay as before
  };

  const handleTranslate = () => {
    if (!translationOn) {
      setOutputText(inputText);
      return;
    }
    // Minimal mock translation behavior
    const mock = `${inputText} [auto-translated]`;
    setOutputText(mock);
  };

  useEffect(() => {
    handleTranslate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, translationOn]);

  return (
    <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Mock video panels */}
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local video */}
          <div className="relative aspect-video rounded-lg border border-[#00FFFF]/30 bg-gradient-to-br from-[#151515] to-[#0F0F0F] overflow-hidden">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!connected && (
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-24 h-24 rounded-full bg-[#222] border border-[#00FFFF]/20" />
              </div>
            )}
            {cameraError && !connected && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-black/70">
                <p className="text-red-500 text-sm">{cameraError}</p>
              </div>
            )}
            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-[#00FFFF]/20 text-[#00FFFF] font-orbitron">You</div>
          </div>

          {/* Remote video */}
          <div className="relative aspect-video rounded-lg border border-[#FF0080]/30 bg-gradient-to-br from-[#151515] to-[#0F0F0F] overflow-hidden">
            {!connected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-gray-500 text-sm">Searching for a match…</div>
              </div>
            )}
            {connected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-36 rounded-lg bg-[#2a2a2a] flex flex-col items-center justify-center border border-[#FF0080]/20">
                    <div className="w-12 h-12 rounded-full bg-[#333] mb-2"></div>
                    <div className="w-20 h-4 rounded-md bg-[#333]"></div>
                </div>
              </div>
            )}
            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-[#FF0080]/20 text-[#FF0080] font-orbitron">Stranger</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!connected ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-4 py-2 rounded bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron text-sm font-bold disabled:opacity-60"
            >
              {connecting ? 'Connecting…' : 'CONNECT NOW'}
            </button>
          ) : (
            <>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded border border-[#FF0080]/50 text-[#FF0080] font-orbitron text-sm font-bold hover:bg-[#FF0080]/10"
              >
                DISCONNECT
              </button>
              <button
                onClick={handleNextPartner}
                className="px-4 py-2 rounded border border-[#00FFFF]/50 text-[#00FFFF] font-orbitron text-sm font-bold hover:bg-[#00FFFF]/10"
              >
                NEXT PARTNER
              </button>
            </>
          )}
          <span className="text-xs text-gray-400">Session duration: <span className="text-[#8AFF00] font-semibold">{formattedDuration}</span> (no time limit)</span>
        </div>
      </div>

      <div className="bg-[#1B1B1B] border border-[#00FFFF]/30 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-orbitron font-bold">Connection setup</h4>
          <span className="text-xs text-gray-400">Online: <span className="text-[#8AFF00] font-semibold">{onlineUsers.toLocaleString()}</span></span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Country</label>
            <select
              className="w-full bg-[#0F0F0F] border border-[#00FFFF]/30 rounded px-3 py-2 text-sm"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gender</label>
            <select
              className="w-full bg-[#0F0F0F] border border-[#00FFFF]/30 rounded px-3 py-2 text-sm"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              {genders.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#8AFF00]/50 bg-transparent"
                checked={coupleMode}
                onChange={(e) => setCoupleMode(e.target.checked)}
              />
              Couple mode
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!connected ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-4 py-2 rounded bg-gradient-to-r from-[#FF0080] to-[#00FFFF] text-white font-orbitron text-sm font-bold disabled:opacity-60"
            >
              {connecting ? 'Connecting…' : 'CONNECT NOW'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded border border-[#FF0080]/50 text-[#FF0080] font-orbitron text-sm font-bold hover:bg-[#FF0080]/10"
            >
              DISCONNECT
            </button>
          )}
          <span className="text-xs text-gray-400">Session duration: <span className="text-[#8AFF00] font-semibold">{formattedDuration}</span> (no time limit)</span>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <span className="inline-flex items-center gap-2 mr-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8AFF00] shadow-[0_0_12px_#8AFF00]" /> Fast connection
          </span>
          <span className="inline-flex items-center gap-2 mr-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8AFF00] shadow-[0_0_12px_#8AFF00]" /> No time limits
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8AFF00] shadow-[0_0_12px_#8AFF00]" /> Ad-free
          </span>
        </div>
      </div>

      <div className="bg-[#1B1B1B] border border-[#FF0080]/30 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-orbitron font-bold">Auto-translate demo</h4>
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#8AFF00]/50 bg-transparent"
              checked={translationOn}
              onChange={(e) => setTranslationOn(e.target.checked)}
            />
            Enable translate
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">You say</label>
            <textarea
              className="w-full h-28 bg-[#0F0F0F] border border-[#00FFFF]/30 rounded px-3 py-2 text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Partner sees</label>
            <div className="w-full h-28 bg-[#0F0F0F] border border-[#00FFFF]/30 rounded px-3 py-2 text-sm text-gray-200 overflow-auto">
              {outputText}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="text-xs text-gray-400">
            <span className="block">Safe & anonymous: No personal info required.</span>
            <span className="block">Available: Mobile app & Website.</span>
          </div>
          <div className="text-xs text-gray-400">
            <span className="block">Filters: Country ({selectedCountry}), Gender ({selectedGender}){coupleMode ? ', Couple' : ''}.</span>
            <span className="block">Status: {connected ? 'Connected' : 'Not connected'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Removed marketing-style feature list per request

export default function TVPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] circuit-bg">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="scanlines mb-8">
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                <span className="glow-cyan">PANDA</span>
                <span className="glow-pink">TV</span>
                <span className="ml-3 align-middle text-[10px] tracking-widest px-2 py-1 rounded border border-[#8AFF00]/50 text-[#8AFF00] bg-[#8AFF00]/10">BETA</span>
              </h1>
              <p className="text-gray-400 text-sm">Random video connection simulator</p>
            </div>
            <FeatureSimulator />
          </div>
        </main>
      </div>
    </div>
  );
}


