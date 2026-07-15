import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiscardConfirmModal } from '@/components/discard-confirm-modal';
import { ArrowRightIcon } from '@/components/icons/arrow-right-icon';
import { BackButtonIcon } from '@/components/icons/back-button-icon';
import { FlowerIcon } from '@/components/icons/flower-icon';
import { clearPendingThoughtDate, saveThoughtDraft } from '@/lib/doodle-store';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  surface: '#FEF7FF',
  primaryContainer: '#EADDFF',
};

export default function NewThoughtScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);
  const titleTranslateY = useRef(new Animated.Value(0)).current;
  const flowerTranslateY = useRef(new Animated.Value(0)).current;
  const flowerOpacity = useRef(new Animated.Value(1)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const [thought, setThought] = useState('');
  const [body, setBody] = useState('');
  const [stage, setStage] = useState<'title' | 'body'>('title');
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

  const wordCount = thought.trim() ? thought.trim().split(/\s+/).filter(Boolean).length : 0;
  const canAdvance = wordCount >= 2;
  const hasDraftContent = thought.trim().length > 0 || body.trim().length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stage === 'title') {
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bodyOpacity, {
          toValue: 0,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flowerTranslateY, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flowerOpacity, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    const timer = setTimeout(() => {
      bodyRef.current?.focus();
    }, 50);

    Animated.parallel([
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bodyOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(flowerTranslateY, {
        toValue: 176,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(flowerOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearTimeout(timer);
  }, [bodyOpacity, flowerOpacity, flowerTranslateY, stage, titleTranslateY]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (discardModalVisible) {
          setDiscardModalVisible(false);
          return true;
        }

        if (hasDraftContent) {
          setDiscardModalVisible(true);
          return true;
        }

        return false;
      });

      return () => subscription.remove();
    }, [discardModalVisible, hasDraftContent]),
  );

  const handleAdvance = () => {
    if (!canAdvance) {
      return;
    }

    if (stage === 'title') {
      setStage('body');
      return;
    }

    saveThoughtDraft({ title: thought.trim(), body: body.trim() });
    router.push('/doodle');
  };

  const handleFlowerPress = () => {
    if (!canAdvance) {
      return;
    }

    saveThoughtDraft({ title: thought.trim() });
    router.push('/doodle');
  };

  const handleAttemptExit = () => {
    if (hasDraftContent) {
      setDiscardModalVisible(true);
      return;
    }

    router.back();
  };

  const handleDiscardDraft = () => {
    clearPendingThoughtDate();
    setDiscardModalVisible(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.shell}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={handleAttemptExit} style={styles.backButton}>
              <BackButtonIcon width={28.8} height={28.8} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.body, stage === 'title' ? styles.bodyCentered : styles.bodyTop]}>
              <Animated.View style={[styles.noteGroup, { transform: [{ translateY: titleTranslateY }] }]}>
                <TextInput
                  ref={inputRef}
                  value={thought}
                  onChangeText={setThought}
                  placeholder="Type your thought..."
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  multiline
                  autoFocus
                  style={styles.thoughtInput}
                  selectionColor={COLORS.mainBlue}
                  textAlignVertical="top"
                />

                {stage === 'body' ? (
                  <Animated.View style={[styles.bodyInputWrap, { opacity: bodyOpacity }]}>
                    <TextInput
                      ref={bodyRef}
                      value={body}
                      onChangeText={setBody}
                      placeholder="Continue your note..."
                      placeholderTextColor="rgba(0, 0, 0, 0.4)"
                      multiline
                      style={styles.bodyInput}
                      selectionColor={COLORS.mainBlue}
                      textAlignVertical="top"
                    />
                  </Animated.View>
                ) : null}
              </Animated.View>
            </View>

            <View style={styles.composerArea}>
              <View style={styles.composerRow}>
                <Animated.View
                  style={[
                    styles.flowerShell,
                    { opacity: flowerOpacity, transform: [{ translateY: flowerTranslateY }] },
                  ]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Flower"
                    onPress={handleFlowerPress}
                    disabled={!canAdvance}
                    style={({ pressed }) => [
                      styles.flowerButton,
                      !canAdvance && styles.disabledButton,
                      pressed && canAdvance && styles.pressedButton,
                    ]}>
                    <View style={styles.flowerButtonMotion}>
                      <View style={styles.flowerIconWrap}>
                        <FlowerIcon width={24.39} height={24.39} />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send thought"
                  disabled={!canAdvance}
                  style={({ pressed }) => [
                    styles.sendButton,
                    styles.composerButton,
                    !canAdvance && styles.disabledButton,
                    pressed && canAdvance && styles.pressedButton,
                  ]}
                  onPress={handleAdvance}>
                  <ArrowRightIcon />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        <DiscardConfirmModal
          visible={discardModalVisible}
          onStay={() => setDiscardModalVisible(false)}
          onDiscard={handleDiscardDraft}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  shell: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 39,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 29.84,
    height: 29.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 33.8,
  },
  bodyCentered: {
    justifyContent: 'center',
  },
  bodyTop: {
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  noteGroup: {
    alignSelf: 'stretch',
  },
  thoughtInput: {
    color: COLORS.black,
    opacity: 1,
    fontSize: 24,
    fontWeight: '500',
    padding: 0,
    margin: 0,
    minHeight: 34,
  },
  bodyInputWrap: {
    marginTop: 24,
  },
  bodyInput: {
    color: COLORS.black,
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '400',
    padding: 0,
    marginHorizontal: 0,
    minHeight: 120,
  },
  composerArea: {
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  composerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 41,
  },
  flowerShell: {
    width: 66.5,
    height: 41,
  },
  composerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowerButton: {
    width: 66.5,
    height: 41,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
    elevation: 5,
  },
  flowerButtonMotion: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowerIconWrap: {
    width: 24.39,
    height: 24.39,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 66.5,
    height: 41,
    padding: 16,
    backgroundColor: COLORS.mainBlue,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.mainBlue,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.85,
  },
});