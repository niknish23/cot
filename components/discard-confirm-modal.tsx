import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export function DiscardConfirmModal({ visible, onCancel, onDiscard, onStay }: { visible: boolean; onCancel?: () => void; onDiscard: () => void; onStay?: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Discard changes?</Text>
          <View style={styles.row}>
            <Pressable onPress={onStay || onCancel} style={styles.buttonSecondary}><Text>Cancel</Text></Pressable>
            <Pressable onPress={onDiscard} style={styles.buttonDanger}><Text style={{color:'#fff'}}>Discard</Text></Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  sheet: { width: 300, padding: 20, backgroundColor: '#fff', borderRadius: 12 },
  title: { fontSize: 18, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  buttonSecondary: { padding: 10 },
  buttonDanger: { padding: 10, backgroundColor: '#392EFF', borderRadius: 8 },
});
