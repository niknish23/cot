import { useRouter } from 'expo-router';

import { JournalScreen } from '@/components/journal-screen';

export default function DiaryScreen() {
  const router = useRouter();

  return <JournalScreen initialTab="diary" onThoughtPress={(id) => router.push(`/thought/${id}`)} />;
}