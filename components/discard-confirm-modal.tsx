import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  mainBlue: '#392EFF',
  lightBlue: '#DAE2FF',
  slightWhite: '#F7F7F7',
};

type DiscardConfirmModalProps = {
  visible: boolean;
  onStay: () => void;
  onDiscard: () => void;
};

export function DiscardConfirmModal({ visible, onStay, onDiscard }: DiscardConfirmModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onStay}>
      <Pressable style={styles.backdrop} onPress={onStay}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Discard</Text>
          <Text style={styles.message}>Discard this thought?</Text>

          <View style={styles.actionsRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Keep editing" onPress={onStay} style={styles.noButton}>
              <Text style={styles.actionText}>No!</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Discard thought" onPress={onDiscard} style={styles.yesButton}>
              <Text style={styles.actionText}>Yes..</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 329,
    padding: 32,
    backgroundColor: COLORS.white,
    borderRadius: 27,
    alignItems: 'center',
    gap: 28,
  },
  title: {
    alignSelf: 'stretch',
    color: COLORS.black,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  message: {
    alignSelf: 'stretch',
    color: COLORS.black,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },
  actionsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
  },
  noButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yesButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.slightWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.mainBlue,
    fontSize: 16,
    fontWeight: '500',
  },
});