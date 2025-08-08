// src/app/poker/[roomId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PokerRoom() {
  const { roomId } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<string[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('pokerRoomData');
    if (!stored) {
      // redirect to create/join page with roomId filled in
      router.replace(`/poker?roomId=${roomId}`);
      return;
    }

    const { userName: storedUserName } = JSON.parse(stored);
    setUserName(storedUserName);

    // TODO: Integrate Ably here to sync participants across clients
    setParticipants((prev) => Array.from(new Set([...prev, storedUserName])));
  }, [roomId, router]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Poker Room: {roomId}</h2>
      <h3>Participants:</h3>
      <ul>
        {participants.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}