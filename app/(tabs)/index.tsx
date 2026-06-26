import { useLocalSearchParams, useRouter } from 'expo-router';

import { JournalScreen } from '@/components/journal-screen';
import { ThoughtAddedModal } from '@/components/thought-added-modal';
import { readDoodle } from '@/lib/doodle-store';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ thoughtAdded?: string }>();
  const strokes = readDoodle();
  const showModal = params.thoughtAdded === '1' && Boolean(strokes?.length);

  return (
    <>
      <JournalScreen initialTab="chat" onThoughtPress={(id) => router.push(`/thought/${id}`)} />
      {showModal && strokes ? <ThoughtAddedModal strokes={strokes} onDismiss={() => router.replace('/')} /> : null}
    </>
  );
}
