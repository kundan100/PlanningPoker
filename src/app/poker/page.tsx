// src/app/poker/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function generateRandomId(existingIds: Set<string>) {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const geoInfo = typeof navigator !== 'undefined' ? hashString(navigator.language) : 'xx';
  const platform = typeof navigator !== 'undefined' ? hashString(navigator.platform) : 'web';
  let id;
  do {
    id = `${timestamp}-${randomPart}-${geoInfo}-${platform}`;
  } while (existingIds.has(id));
  return id;
}

const usedIds = new Set<string>();


function PokerHomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isJoinMode, setIsJoinMode] = useState(false);

  useEffect(() => {
    const storedPokerRoomData = sessionStorage.getItem('pokerRoomData');
    const urlRoomId = searchParams.get('roomId');

    if (storedPokerRoomData) {
      const parsed = JSON.parse(storedPokerRoomData);
      setRoomId(parsed.roomId);
      setRoomName(parsed.roomName || '');
      setIsJoinMode(false);
    } else if (urlRoomId) {
      setRoomId(urlRoomId);
      setRoomName(urlRoomId);
      setIsJoinMode(true);
    } else {
      const id = generateRandomId(usedIds);
      usedIds.add(id);
      setRoomId(id);
      setIsJoinMode(false);
    }
  }, [searchParams]);

  const handleCreateOrJoin = () => {
    if (!userName) {
      alert('Please fill in the field (Your Name)');
      return;
    }

    const finalRoomName = roomName || roomId;

    sessionStorage.setItem('pokerRoomData', JSON.stringify({
      roomId,
      roomName: finalRoomName,
      userName,
    }));

    router.push(`/poker/${roomId}`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '2rem', border: '1px solid #eee' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{isJoinMode ? 'Join Poker Room' : 'Create Poker Room'}</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Room Name: <span style={{ backgroundColor: '#f9f9f9', color: '#999', fontSize: '0.875rem' }}>{roomId}</span>
          </label>

          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="[Optional] Enter custom room-name"
            disabled={isJoinMode}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: isJoinMode ? '#f5f5f5' : '#fff',
              color: isJoinMode ? '#666' : '#000',
            }}
          />
          {isJoinMode && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
              You are joining an existing room. Room name cannot be changed.
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Name</label>
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
        </div>

        <button onClick={handleCreateOrJoin} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          {isJoinMode ? 'Join Room' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}

export default function PokerHome() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PokerHomeInner />
    </Suspense>
  );
}