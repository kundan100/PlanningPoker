// -----------------------------------------------------------------------------
// src/app/poker/[roomId]/page.tsx  (now with Ably presence integration)
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';

export default function PokerRoom() {
  const { roomId } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const ablyRef = useRef<any | null>(null);
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pokerRoomData');
    if (!stored) {
      // redirect to create/join page with roomId filled in
      router.replace(`/poker?roomId=${roomId}`);
      return;
    }

    const parsed = JSON.parse(stored);
    setUserName(parsed.userName);

    // ensure we have a stable clientId for Ably presence
    let clientId = parsed.ablyClientId;
    if (!clientId) {
      clientId = `${parsed.userName.replace(/\s+/g, '')}-${Math.random().toString(36).slice(2, 8)}`;
      parsed.ablyClientId = clientId;
      sessionStorage.setItem('pokerRoomData', JSON.stringify(parsed));
    }

    let mounted = true;

    async function initAbly() {
      try {
        const ably = new Ably.Realtime({ authUrl: `/api/ably-auth?clientId=${encodeURIComponent(clientId)}` });
        ablyRef.current = ably;

        const channel = ably.channels.get(`poker-room-${roomId}`);
        channelRef.current = channel;

        // subscribe to presence enter/leave to keep participant list in sync
        channel.presence.subscribe('enter', (member: any) => {
          const name = (member.data && member.data.name) || member.clientId || member.id;
          setParticipants((prev) => (prev.includes(name) ? prev : [...prev, name]));
        });

        channel.presence.subscribe('leave', (member: any) => {
          const name = (member.data && member.data.name) || member.clientId || member.id;
          setParticipants((prev) => prev.filter((p) => p !== name));
        });

        // fetch current presence members and populate the list
        try {
          const members = await channel.presence.get();
          if (mounted) {
            const names = members.map((m: any) => (m.data && m.data.name) || m.clientId || m.id);
            setParticipants(names);
          }
        } catch (err) {
          console.warn('Error fetching presence members', err);
        }

        // enter presence for this client (announce ourselves)
        await channel.presence.enter({ name: parsed.userName });
      } catch (err) {
        console.error('Ably init error', err);
      }
    }

    initAbly();

    return () => {
      mounted = false;
      try {
        if (channelRef.current) channelRef.current.presence.leave();
      } catch (e) {
        // ignore
      }
      try {
        if (ablyRef.current) ablyRef.current.close();
      } catch (e) {
        // ignore
      }
    };
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