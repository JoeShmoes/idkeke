'use client';

import { use } from 'react';
import ExcalidrawRoom from '@/components/collaboration/ExcalidrawRoom';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ExcalidrawRoom roomId={id} />;
}
