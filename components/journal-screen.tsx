import React from 'react';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { readThoughts } from '@/lib/doodle-store';
import { DoodlePreview } from '@/components/doodle-preview';

export default function JournalScreen() {
  const thoughts = readThoughts();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thoughts</Text>
      <FlatList
        data={thoughts}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item}>
            <Link href={`/thought/${item.id}`}><Text style={styles.title}>{item.title}</Text></Link>
            <DoodlePreview strokes={item.strokes} width={80} height={80} padding={8} />
          </Pressable>
        )}
      />
      <Link href="/new-thought"><Text style={styles.new}>+ New Thought</Text></Link>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 20 }, header: { fontSize: 20, fontWeight: '600' }, item: { paddingVertical: 12 }, title: { fontSize: 16 }, new: { position: 'absolute', right: 20, bottom: 40, backgroundColor: '#392EFF', color: '#fff', padding: 12, borderRadius: 20 } });
