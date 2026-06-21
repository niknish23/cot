import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export function ThoughtAddedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Thought added</Text>
          <Pressable onPress={onClose} style={styles.button}><Text style={{color:'#fff'}}>OK</Text></Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  sheet: { width: 280, padding: 18, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  title: { fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#392EFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
});
