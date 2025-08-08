// src/app/poker/[boardId]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
  params: {
    boardId: string;
  };
};

export default function BoardPage({ params }: Props) {
    const { boardId } = useParams();
  const [boardData, setBoardData] = useState<{ boardId: string; boardName: string; userName: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pokerBoardData');
    if (stored) {
      setBoardData(JSON.parse(stored));
    }
  }, []);
  //
  if (!boardData) {
    return <div style={{ padding: '2rem' }}>No board data found. Please create a board first.</div>;
  }
  //
    console.log('BoardPage params:', params);
  // You can use params.boardId to fetch board-specific data or render content

  return (
    <div style={{ padding: '1rem' }}>
      <div>Board: {boardData.boardName}</div>
      <p>Board ID: {boardId}</p>
      <p>User (Host): {boardData.userName}</p>
    </div>
  );
}
