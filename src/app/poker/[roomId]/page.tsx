// -----------------------------------------------------------------------------
// src/app/poker/[roomId]/page.tsx  (now with Ably presence integration)
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import '../../shared/styles/shared.css';

export default function PokerRoom() {
  const { roomId } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(false);
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
    // Host is the user who created the room (room creator)
    setIsHost(parsed.isHost === true || parsed.isHost === 'true');

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

        // Listen for voting state events
        channel.subscribe('voting-state', (msg: any) => {
          setVotingEnabled(!!(msg.data && msg.data.enabled));
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

  // Handler for host to start a new round
  const handleNewRound = () => {
    if (channelRef.current) {
      channelRef.current.publish('voting-state', { enabled: true });
    }
    // Do NOT setVotingEnabled here; rely on Ably event for all clients
  };
  // On mount, request the latest voting state (optional: host can re-publish state on join)
  // Optionally, you can fetch channel history here to sync late joiners

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {/* Left column: Room info and participants */}
        <div className="col-1" style={{ width: '60%' }}>
          {/* <h2>Poker Room: {roomId}</h2>
          <h3>Participants:</h3>
          <ul>
            {participants.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul> */}
          <div className="card">
            <div className="nested-card" style={{ width: '100%' }}><b>Poker Room:</b> {roomId}</div>
          </div>
          <div className="card" style={{ marginTop: '1rem', maxHeight: '50vh', overflowY: 'auto' }}>
            {participants.map((p) => (
              <div key={p} className="nested-card ellipsis" style={{ width: '47%' }}>{p}</div>
            ))}
          </div>
        </div>

        {/* Right column: Placeholder for future content */}
        <div className="col-2" style={{ width: '35%', background: '#f9f9f9' }}>
          {/* Add your poker table, chat, or other features here */}
          <div className="card">
            {isHost && (
              <button
                style={{ marginRight: '0.5rem', paddingLeft: '0.5rem' }}
                onClick={handleNewRound}
                disabled={votingEnabled}
              >
                <div className="nested-card ellipsis">New Round</div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* voting cards */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        {[0, 1, 2, 3, 5, 8, 13, 21].map((val) => (
          <button
            key={val}
            style={{ marginRight: '0.5rem', paddingLeft: '0.5rem' }}
            className="vote-btn"
            disabled={!votingEnabled}
          >
            <div className="nested-card ellipsis">{val}</div>
          </button>
        ))}
      </div>
    </>
  );
}
