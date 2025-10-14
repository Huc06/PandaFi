
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PubNub from 'pubnub';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

function FeatureSimulator() {
  // Signaling config via environment variables
  const PUB_KEY = process.env.NEXT_PUBLIC_PUBNUB_PUBLISH_KEY;
  const SUB_KEY = process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY;
  const ROOM_ID = 'panda-tv-room';
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

  useEffect(() => {
    // Simulate thousands of users online
    const seed = () => 120000 + Math.floor(Math.random() * 60000);
    setOnlineUsers(seed());
    const id = setInterval(() => setOnlineUsers(seed()), 4000);
    return () => clearInterval(id);
  }, []);

  // Initialize local media
  useEffect(() => {
    let stopped = false;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (stopped) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }
        setWebrtcReady(true);
      })
      .catch(() => setWebrtcReady(false));
    return () => {
      stopped = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  // Initialize PubNub signaling
  useEffect(() => {
    if (!PUB_KEY || !SUB_KEY) return; // require env keys
    const client = new PubNub({ publishKey: PUB_KEY, subscribeKey: SUB_KEY, uuid: myUuidRef.current });
    pubnubRef.current = client;
    client.subscribe({ channels: [ROOM_ID] });

    const onMessage = async (evt: any) => {
      const msg = evt?.message;
      if (!msg || msg.room !== ROOM_ID) return;
      if (msg.from && msg.from === myUuidRef.current) return; // ignore self
      try {
        if (msg.type === 'offer') {
          // glare handling: if we already made an offer, tie-break using uuid
          if (pcRef.current?.localDescription?.type === 'offer' && !pcRef.current?.remoteDescription) {
            const theirs = String(msg.from ?? '');
            const mine = myUuidRef.current;
            if (mine < theirs) {
              // we win: ignore their offer
              return;
            }
            // they win: restart as answerer
            pcRef.current?.close();
            pcRef.current = null;
          }
          if (!pcRef.current) createPeerConnection();
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          const answerPayload = { type: 'answer', sdp: { type: answer.type, sdp: answer.sdp ?? '' }, room: ROOM_ID, from: myUuidRef.current };
          client.publish({ channel: ROOM_ID, message: answerPayload as any });
          // flush pending ICE now that remote description is set
          if (pendingIceRef.current.length) {
            for (const c of pendingIceRef.current) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingIceRef.current = [];
          }
          setSignalingInfo('answered-offer');
        } else if (msg.type === 'answer') {
          if (!pcRef.current) return; // only initiator expects answer
          if (!pcRef.current.currentRemoteDescription) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          }
          if (pendingIceRef.current.length) {
            for (const c of pendingIceRef.current) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingIceRef.current = [];
          }
          setSignalingInfo('received-answer');
        } else if (msg.type === 'ice') {
          if (!pcRef.current || !msg.candidate) return;
          if (!pcRef.current.remoteDescription) {
            pendingIceRef.current.push(msg.candidate);
          } else {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        } else if (msg.type === 'hello') {
          // presence ping; no-op here
        }
      } catch {}
    };

    const onStatus = (st: any) => {
      if (st?.category === 'PNConnectedCategory') {
        setSignalReady(true);
        client.publish({ channel: ROOM_ID, message: { type: 'hello', room: ROOM_ID, from: myUuidRef.current } });
        setSignalingInfo('subscribed');
      }
    };

    client.addListener({ message: onMessage, status: onStatus });
    return () => {
      client.unsubscribeAll();
      client.stop();
      pubnubRef.current = null;
    };
  }, [PUB_KEY, SUB_KEY]);

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

  const createPeerConnection = () => {
    if (pcRef.current) pcRef.current.close();
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;

    // local tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    }

    pc.ontrack = (evt) => {
      const [remoteStream] = evt.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        (remoteVideoRef.current as HTMLVideoElement).play?.();
      }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate && pubnubRef.current) {
        const c = (evt.candidate as any).toJSON ? (evt.candidate as any).toJSON() : {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex,
          usernameFragment: (evt.candidate as any).usernameFragment,
        };
        pubnubRef.current.publish({ channel: ROOM_ID, message: { type: 'ice', candidate: c, room: ROOM_ID } as any });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') setConnected(true);
      if (state === 'failed' || state === 'disconnected' || state === 'closed') setConnected(false);
      setSignalingInfo(`pc:${state}`);
    };

    return pc;
  };

  const handleConnect = async () => {
    if (connecting || !signalReady || !webrtcReady) return;
    setConnecting(true);
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true } as any);
      await pc.setLocalDescription(offer);
      const offerPayload = { type: 'offer', sdp: { type: offer.type, sdp: offer.sdp ?? '' }, room: ROOM_ID, from: myUuidRef.current };
      pubnubRef.current?.publish({ channel: ROOM_ID, message: offerPayload as any });
      setSessionStart(Date.now());
      setSignalingInfo('sent-offer');
    } finally {
      setTimeout(() => setConnecting(false), 300);
    }
  };

  const handleDisconnect = () => {
    stopCamera();
    setConnected(false);
    setSessionStart(null);
    setSessionSeconds(0);
    pcRef.current?.close();
    pcRef.current = null;
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
            <video ref={localVideoRef} playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-[#00FFFF]/20 text-[#00FFFF] font-orbitron">You</div>
          </div>

          {/* Remote video */}
          <div className="relative aspect-video rounded-lg border border-[#FF0080]/30 bg-gradient-to-br from-[#151515] to-[#0F0F0F] overflow-hidden">
            {!connected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-gray-500 text-sm">{signalReady && webrtcReady ? 'Searching for a match…' : 'Waiting for permissions/config…'}</div>
              </div>
            )}
            <video ref={remoteVideoRef} playsInline className="absolute inset-0 w-full h-full object-cover" />
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
                onClick={() => {
                  handleDisconnect();
                  setTimeout(() => handleConnect(), 400);
                }}
                className="px-4 py-2 rounded border border-[#00FFFF]/50 text-[#00FFFF] font-orbitron text-sm font-bold hover:bg-[#00FFFF]/10"
              >
                NEXT PARTNER
              </button>
            </>
          )}
          <span className="text-xs text-gray-400">Session duration: <span className="text-[#8AFF00] font-semibold">{formattedDuration}</span> (no time limit)</span>
          <span className="text-[10px] text-gray-500 border border-[#00FFFF]/30 rounded px-2 py-1">{signalingInfo}</span>
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


