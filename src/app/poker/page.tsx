'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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
  const timestamp = Date.now().toString(36); // base36 timestamp
  const randomPart = Math.random().toString(36).substring(2, 10); // 8-char random string

  const geoInfo = typeof navigator !== 'undefined' ? hashString(navigator.language) : 'xx';
  const platform = typeof navigator !== 'undefined' ? hashString(navigator.platform) : 'web';

  let id;
  do {
    id = `${timestamp}-${randomPart}-${geoInfo}-${platform}`;
  } while (existingIds.has(id));

  return id;
}

const usedIds = new Set<string>();

export default function PokerHome() {
  const router = useRouter();
  const [boardName, setBoardName] = useState('');
  const [userName, setUserName] = useState('');
  const [boardId, setBoardId] = useState('');

  useEffect(() => {
    // read pokerBoardData from sessionStorage
    const storedPokerBoardData = sessionStorage.getItem('pokerBoardData');
    //
    if (storedPokerBoardData) {
        const parsedPokerBoardData = JSON.parse(storedPokerBoardData);
        setBoardId(parsedPokerBoardData.boardId);
    } else {
        const id = generateRandomId(usedIds);
        usedIds.add(id);
        setBoardId(id);
    }
  }, []);

  const handleCreate = () => {
    // without entering user-name, it will not redirect to the board.
    // And, if boardName is not entered, consider boardId as boardName. 
    if (!userName) {
      alert('Please fill in the field (Your Name)');
      return;
    }else {
      if (!boardName) setBoardName(boardId);
    }
    // Store in sessionStorage
    sessionStorage.setItem('pokerBoardData', JSON.stringify({
        boardId,
        boardName: boardName || boardId,
        userName,
    }));
    // Redirect to the board page with the generated boardId.
    router.push(`/poker/${boardId}`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          border: '1px solid #eee',
        }}
      >
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Poker Board</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Board Name: <span style={{backgroundColor: '#f9f9f9', color: '#999', fontSize: '0.875rem'}}>{boardId}</span>
          </label>
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="[Optional] Enter custom board-name"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <button
          onClick={handleCreate}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-in-out',
          }}
        >
          Create Board
        </button>
      </div>
    </div>
  );
}
