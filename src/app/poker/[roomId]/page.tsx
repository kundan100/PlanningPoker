// src/app/poker/[roomId]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
  params: {
    roomId: string;
  };
};

export default function RoomPage({ params }: Props) {
    const { roomId } = useParams();
  const [roomData, setRoomData] = useState<{ roomId: string; roomName: string; userName: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pokerRoomData');
    if (stored) {
      setRoomData(JSON.parse(stored));
    }
  }, []);
  //
  if (!roomData) {
    return <div style={{ padding: '2rem' }}>No room data found. Please create a room first.</div>;
  }
  //
    console.log('RoomPage params:', params);
  // You can use params.roomId to fetch room-specific data or render content

  return (
    <div style={{ padding: '1rem' }}>
      <div>Room: {roomData.roomName}</div>
      <p>Room ID: {roomData.roomId}</p>
      <p>User (Host): {roomData.userName}</p>
    </div>
  );
}
