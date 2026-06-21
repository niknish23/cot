import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createThought } from '@/lib/doodle-store';
import { ThoughtAddedModal } from '@/components/thought-added-modal';

export default function NewThought() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleCreate = () => {
    const t = createThought(title || 'Untitled', body);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
      router.replace(`/thought/${t.id}`);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />
      <Text style={styles.label}>Body</Text>
      <TextInput value={body} onChangeText={setBody} style={[styles.input, {height:120}]} multiline />
      <Pressable onPress={handleCreate} style={styles.button}><Text style={{color:'#fff'}}>Create</Text></Pressable>
      <ThoughtAddedModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex:1, padding:20 }, label: { marginTop:12 }, input: { borderWidth:1, borderColor:'#eee', padding:8, borderRadius:8 }, button: { backgroundColor:'#392EFF', padding:12, marginTop:20, alignItems:'center', borderRadius:8 } });
