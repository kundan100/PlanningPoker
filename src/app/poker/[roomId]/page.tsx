// -----------------------------------------------------------------------------
// src/app/poker/[roomId]/page.tsx  (now with Ably presence integration)
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import '../../shared/styles/shared.css';

export default function PokerRoom() {

  const _helpers = {
    getSpinnerForVotingValue: (p ="") => {
      console.log("cyk--10-1 > getSpinnerForVotingValue > votesStatus[p]", votesStatus[p])
      return (<span className="loader" style={{ display: votingEnabled ? 'inline-block' : 'none', width: 16, height: 16, verticalAlign: 'middle' }}>
      <svg viewBox="0 0 50 50" style={{ width: 16, height: 16 }}>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={votesStatus[p] ? "#00ff00" : "#ff0000"}
          strokeWidth="5"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </span>)
    }
  };
  // Helper to render a participant's vote cleanly
  function renderVote(name: string) {
    if (votes && Object.prototype.hasOwnProperty.call(votes, name) && votes[name] !== null) {
      return votes[name];
    }
    // return _helpers.getSpinnerForVotingValue(false);
  }
  const { roomId } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [revealEnabled, setRevealEnabled] = useState(false);
  // Store only this user's vote locally until reveal
  const [votes, setVotes] = useState<{ [name: string]: number | null }>({});
  const [votesStatus, setVotesStatus] = useState<{ [name: string]: boolean | null }>({});
  const [myVote, setMyVote] = useState<number | null>(null);
  // For instant UI feedback on vote selection (UI only)
  const [selectedVote, setSelectedVote] = useState<number | null>(null); // to show the highlight for slected vote-val button
  const ablyRef = useRef<any | null>(null);
  const channelRef = useRef<any | null>(null);
  // --- Fix for stale closure: always use latest value in Ably event handlers ---
  const myVoteRef = useRef<number | null>(null);
  const userNameRef = useRef<string>('');
  useEffect(() => { myVoteRef.current = myVote; }, [myVote]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);

  useEffect(() => {
    console.log("cyk--10-1 > participants", participants);
  }, [participants]);
  useEffect(() => {
    console.log("cyk--10-1 > userName", userName);
  }, [userName]);
  useEffect(() => {
    console.log("cyk--10-1 > votingEnabled", votingEnabled);
  }, [votingEnabled]);
  useEffect(() => {
    console.log("cyk--10-1 > revealEnabled", revealEnabled);
  }, [revealEnabled]);
  useEffect(() => {
    console.log("cyk--10-1 > votes", votes);
  }, [votes]);
  useEffect(() => {
    console.log("cyk--10-1 > votesStatus", votesStatus);
  }, [votesStatus]);
  useEffect(() => {
    console.log("cyk--10-1 > myVote", myVote);
  }, [myVote]);
  useEffect(() => {
    console.log("cyk--10-1 > ablyRef", ablyRef);
  }, [ablyRef]);
  useEffect(() => {
    console.log("cyk--10-1 > channelRef", channelRef);
  }, [channelRef]);

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
          setParticipants((prev) => {
            // Remove all duplicates, keep order of first appearance
            const next = [...prev, name];
            return Array.from(new Set(next));
          });
        });

        channel.presence.subscribe('leave', (member: any) => {
          const name = (member.data && member.data.name) || member.clientId || member.id;
          setParticipants((prev) => prev.filter((p) => p !== name));
        });

        // Listen for voting state events and votes
        let revealActive = false;
        channel.subscribe('voting-state', (msg: any) => {
          console.log('[Ably] voting-state event received', msg.data);
          setVotingEnabled(!!(msg.data && msg.data.enabled));
          setRevealEnabled(!!(msg.data && (msg.data.enabled || msg.data.reveal)));
          if (msg.data && msg.data.enabled) {
            setVotes({}); // Clear votes on new round
            setSelectedVote(null); // clear selection on new round
            revealActive = false;
            console.log('[Ably] New round started, votes cleared');
          }
          if (msg.data && msg.data.reveal) {
            revealActive = true;
            // --- Use refs to get latest values ---
            const latestVote = myVoteRef.current;
            const latestUser = userNameRef.current;
            console.log('[Ably] Reveal triggered, sending my vote if present', { latestVote, latestUser });
            if (latestVote !== null && latestUser) {
              setVotes((prev) => ({ ...prev, [latestUser]: latestVote }));
              setTimeout(() => {
                if (channelRef.current) {
                  channelRef.current.publish('vote', { name: latestUser, vote: latestVote });
                  console.log('[Ably] Published my vote', { name: latestUser, vote: latestVote });
                }
              }, 200);
            }
          }
        });
        channel.subscribe('vote-attempted', (msg: any) => {
          console.log('[Ably] vote-attempted subscribed', msg.data);
          setVotesStatus((prev) => ({ ...prev, ...msg.data}));
        });
        channel.subscribe('vote', (msg: any) => {
          if (!revealActive) {
            console.log('[Ably] Ignoring vote event, reveal not active');
            return;
          }
          if (msg.data && msg.data.name) {
            setVotes((prev) => {
              console.log('[Ably] Received vote for', msg.data.name, 'vote:', msg.data.vote);
              return { ...prev, [msg.data.name]: msg.data.vote };
            });
          }
        });

        // Fetch latest voting state from channel history for late joiners
        try {
          const history = await channel.history({ limit: 50 });
          const votingStateMsg = history.items.find((item: any) => item.name === 'voting-state');
          if (votingStateMsg && votingStateMsg.data) {
            setVotingEnabled(!!votingStateMsg.data.enabled);
            setRevealEnabled(!!votingStateMsg.data.enabled);
            console.log('[Ably] Synced voting state from history', votingStateMsg.data);
          }
          // Only restore votes if reveal is active
          if (votingStateMsg && votingStateMsg.data && votingStateMsg.data.reveal) {
            const voteMsgs = history.items.filter((item: any) => item.name === 'vote');
            const votesObj: { [name: string]: number | null } = {};
            voteMsgs.forEach((item: any) => {
              if (item.data && item.data.name) {
                votesObj[item.data.name] = item.data.vote;
              }
            });
            setVotes(votesObj);
            console.log('[Ably] Synced votes from history', votesObj);
          }
        } catch (err) {
          console.warn('Error fetching voting state history', err);
        }

        // fetch current presence members and populate the list
        try {
          const members = await channel.presence.get();
          if (mounted) {
            // Remove duplicates from Ably presence list
            const names = Array.from(new Set(members.map((m: any) => (m.data && m.data.name) || m.clientId || m.id)));
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
      // Defensive: Only leave presence and close Ably if connection is active and not already closed/closing
      try {
        if (channelRef.current && channelRef.current.connection && channelRef.current.connection.state === 'connected') {
          channelRef.current.presence.leave();
        }
      } catch (e) {
        // ignore
      }
      try {
        if (ablyRef.current && ablyRef.current.connection && ablyRef.current.connection.state === 'connected') {
          ablyRef.current.close();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [roomId, router]);

  // Handler for host to start a new round
  const handleNewRound = () => {
    if (channelRef.current) {
      channelRef.current.publish('voting-state', { enabled: true, reveal: false });
    }
    setMyVote(null);
    setSelectedVote(null); // Reset highlight on new round
    // Do NOT setVotingEnabled or setRevealEnabled here; rely on Ably event for all clients
  };

  const handleRevealVotes = () => {
    console.log("cyk--10-1 > handleRevealVotes", {myVote, votes, votingEnabled, userName, channelRef});
    if (channelRef.current) {
      channelRef.current.publish('voting-state', { enabled: false, reveal: true });
      // Do not send vote here, will be sent in voting-state event handler
    }
    // Do NOT setVotingEnabled or setRevealEnabled here; rely on Ably event for all clients
  };

  // Handler for voting
  const handleVote = (vote: number) => {
    setSelectedVote(vote); // UI highlight only
    // setVotesStatus((prev) => ({ ...prev, [userName]: true })); // mark as voted
    // if (channelRef.current) {
      console.log("cyk--10-1 > handleVote > vote-attempted published");
      channelRef.current.publish('vote-attempted', { [userName]: true });
    // }
    console.log("cyk--10-1 > handleVote", {vote, myVote, votes, votingEnabled, userName});
    if (!votingEnabled || !userName) return;
    setMyVote(vote);
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
                <div key={p} className="nested-card ellipsis" style={{ width: '47%', display: 'flex' }}>
                <span className="participants-name ellipsis" title={p}>
                  {/* Participant's name */}
                  {p}
                </span>
                <span className="participants-vote-value ellipsis">
                  {/* participant's voting-value or spinner till vote is not revealed */}
                  {_helpers.getSpinnerForVotingValue(p)}
                  {revealEnabled && renderVote(p)}
                </span>
                </div>
            ))}
          </div>
        </div>

        {/* Right column: Placeholder for future content */}
        <div className="col-2" style={{ width: '35%', background: '#f9f9f9' }}>
          {/* Add your poker table, chat, or other features here */}
          <div className="card">
            {isHost && (
              <>
                <button
                  className='btn-a'
                  style={{ marginRight: '0.5rem', paddingLeft: '0.5rem' }}
                  onClick={handleNewRound}
                  disabled={votingEnabled}
                >
                  <div className="nested-card ellipsis">New Round</div>
                </button>
                <button
                  className='btn-a'
                  style={{ marginRight: '0.5rem', paddingLeft: '0.5rem' }}
                  onClick={handleRevealVotes}
                  disabled={!votingEnabled || !revealEnabled}
                >
                  <div className="nested-card ellipsis">Reveal Votes</div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* voting cards */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        {[0, 1, 2, 3, 5, 8, 13, 21, 34].map((val) => (
          <button
            key={val}
            style={{ marginRight: '0.5rem', paddingLeft: '0.5rem' }}
            className={`btn-a vote-btn${selectedVote === val ? ' vote-btn-selected' : 'dummy-class'}`}
            // disabled={!votingEnabled || myVote !== null} // this is for one time selection of vote-val
            disabled={!votingEnabled}
            onClick={() => handleVote(val)}
          >
            <div className="nested-card ellipsis">{val}</div>
          </button>
        ))}
      </div>

      {/* Reveal votes table */}
      {/* {revealEnabled && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <b>Votes:</b>
          <ul className="votes-list">
            {participants.map((p) => (
              <li key={p} className="votes-list-item">
                <span className="nested-card ellipsis votes-list-name">{p}:</span>
                <span className="nested-card ellipsis votes-list-vote">
                  {renderVote(p)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </>
  );
}
