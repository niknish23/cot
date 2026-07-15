import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { DiscardConfirmModal } from '@/components/discard-confirm-modal';
import { DoodlePreview } from '@/components/doodle-preview';
import { BackButtonIcon } from '@/components/icons/back-button-icon';
import { CheckMarkIcon } from '@/components/icons/check-mark-icon';
import { CrossButtonIcon } from '@/components/icons/cross-button-icon';
import { DoodleEraserIcon } from '@/components/icons/doodle-eraser-icon';
import { DoodlePencilIcon } from '@/components/icons/doodle-pencil-icon';
import { DustbinIcon } from '@/components/icons/dustbin-icon';
import { FlowerIcon } from '@/components/icons/flower-icon';
import { MoreIcon } from '@/components/icons/more-icon';
import { PencilIcon } from '@/components/icons/pencil-icon';
import { RedoIcon } from '@/components/icons/redo-icon';
import { DOODLE_COORDINATE_SIZE, DOODLE_ERASER_WIDTH, DOODLE_PEN_WIDTH } from '@/constants/doodle';
import { deleteThought, readThoughts, updateThoughtStrokes, updateThoughtText, type DoodleStroke } from '@/lib/doodle-store';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  borderBlack20: 'rgba(0, 0, 0, 0.20)',
};

const EDITOR_CANVAS_SIZE = 297;

function areStrokesEqual(left: DoodleStroke[], right: DoodleStroke[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let strokeIndex = 0; strokeIndex < left.length; strokeIndex += 1) {
    const leftStroke = left[strokeIndex];
    const rightStroke = right[strokeIndex];

    if (leftStroke.color !== rightStroke.color || leftStroke.width !== rightStroke.width || leftStroke.points.length !== rightStroke.points.length) {
      return false;
    }

    for (let pointIndex = 0; pointIndex < leftStroke.points.length; pointIndex += 1) {
      const leftPoint = leftStroke.points[pointIndex];
      const rightPoint = rightStroke.points[pointIndex];

      if (leftPoint.x !== rightPoint.x || leftPoint.y !== rightPoint.y) {
        return false;
      }
    }
  }

  return true;
}

export default function ThoughtDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [textEditOpen, setTextEditOpen] = useState(false);
  const [doodleEditOpen, setDoodleEditOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [editingStrokes, setEditingStrokes] = useState<DoodleStroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<DoodleStroke[]>([]);
  const [editTool, setEditTool] = useState<'pen' | 'eraser'>('pen');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [activeField, setActiveField] = useState<'title' | 'body' | null>(null);
  const [titleSelection, setTitleSelection] = useState<{ start: number; end: number } | undefined>();
  const [bodySelection, setBodySelection] = useState<{ start: number; end: number } | undefined>();
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<'screen' | 'doodle' | null>(null);
  const currentStrokeRef = useRef<DoodleStroke | null>(null);
  const titleInputRef = useRef<TextInput>(null);
  const bodyInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const titleInputY = useRef(0);
  const bodyInputY = useRef(0);
  const titleContentHeight = useRef(0);
  const bodyContentHeight = useRef(0);

  const thoughtId = Array.isArray(params.id) ? params.id[0] : params.id;
  const thought = thoughtId ? readThoughts().find((item) => item.id === thoughtId) : undefined;

  const dateLabel = useMemo(() => {
    if (!thought) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(thought.createdAt));
  }, [thought]);

  const cloneThoughtStrokes = () =>
    thought
      ? thought.strokes.map((stroke) => ({
          ...stroke,
          width: stroke.color.toLowerCase() === '#f7f7f7' || stroke.color === COLORS.white ? DOODLE_ERASER_WIDTH : DOODLE_PEN_WIDTH,
          points: stroke.points.map((point) => ({ ...point })),
        }))
      : [];

  const hasUnsavedTextChanges =
    textEditOpen &&
    (draftTitle.trim() !== (thought?.title ?? '').trim() || draftBody.trim() !== (thought?.body ?? '').trim());

  const hasUnsavedDoodleChanges = doodleEditOpen && !areStrokesEqual(editingStrokes, cloneThoughtStrokes());
  const isAnyEditorOpen = textEditOpen || doodleEditOpen;

  useEffect(() => {
    // Prevent stale discard modal state when navigating between thoughts.
    setDiscardModalVisible(false);
    setDiscardTarget(null);
  }, [thoughtId]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardOffset(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const openEdit = () => {
    setMenuOpen(false);
    const nextTitle = thought?.title ?? '';
    const nextBody = thought?.body ?? '';

    setDraftTitle(nextTitle);
    setDraftBody(nextBody);
    setTitleSelection({ start: nextTitle.length, end: nextTitle.length });
    setBodySelection({ start: nextBody.length, end: nextBody.length });
    setTextEditOpen(true);
    setActiveField(nextBody.length > 0 ? 'body' : 'title');
    requestAnimationFrame(() => {
      if (nextBody.length > 0) {
        bodyInputRef.current?.focus();
        return;
      }

      titleInputRef.current?.focus();
    });
  };

  const openDoodleEditor = () => {
    setEditingStrokes(cloneThoughtStrokes());
    setRedoStrokes([]);
    setEditTool('pen');
    setDoodleEditOpen(true);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const coordinateScale = DOODLE_COORDINATE_SIZE / EDITOR_CANVAS_SIZE;
          const nextStroke: DoodleStroke = {
            points: [{ x: locationX * coordinateScale, y: locationY * coordinateScale }],
            color: editTool === 'eraser' ? COLORS.white : COLORS.mainBlue,
            width: editTool === 'eraser' ? DOODLE_ERASER_WIDTH : DOODLE_PEN_WIDTH,
          };

          currentStrokeRef.current = nextStroke;
          setRedoStrokes([]);
          setEditingStrokes((currentStrokes) => [...currentStrokes, nextStroke]);
        },
        onPanResponderMove: (event) => {
          const currentStroke = currentStrokeRef.current;

          if (!currentStroke) {
            return;
          }

          const { locationX, locationY } = event.nativeEvent;
          const coordinateScale = DOODLE_COORDINATE_SIZE / EDITOR_CANVAS_SIZE;
          currentStroke.points.push({ x: locationX * coordinateScale, y: locationY * coordinateScale });
          setEditingStrokes((currentStrokes) => {
            const nextStrokes = [...currentStrokes];
            nextStrokes[nextStrokes.length - 1] = {
              ...currentStroke,
              points: [...currentStroke.points],
            };
            return nextStrokes;
          });
        },
        onPanResponderRelease: () => {
          currentStrokeRef.current = null;
        },
      }),
    [editTool],
  );

  if (!thought) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Thought not found</Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    openEdit();
  };

  const handleSaveText = () => {
    if (!thought) {
      return;
    }

    updateThoughtText(thought.id, draftTitle, draftBody);
    setTextEditOpen(false);
  };

  const scrollToField = (fieldY: number) => {
    scrollRef.current?.scrollTo({ y: Math.max(fieldY - 120, 0), animated: true });
  };

  const scrollToCursor = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleDoodleHistoryPress = () => {
    if (redoStrokes.length > 0) {
      const nextStroke = redoStrokes[redoStrokes.length - 1];
      setRedoStrokes((currentRedoStrokes) => currentRedoStrokes.slice(0, -1));
      setEditingStrokes((currentStrokes) => [...currentStrokes, nextStroke]);
      return;
    }

    setEditingStrokes((currentStrokes) => {
      if (currentStrokes.length === 0) {
        return currentStrokes;
      }

      const nextStroke = currentStrokes[currentStrokes.length - 1];
      setRedoStrokes((currentRedoStrokes) => [...currentRedoStrokes, nextStroke]);
      return currentStrokes.slice(0, -1);
    });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    deleteThought(thought.id);
    router.replace('/');
  };

  const requestDiscard = (target: 'screen' | 'doodle') => {
    setDiscardTarget(target);
    setDiscardModalVisible(true);
  };

  const handleAttemptScreenExit = () => {
    if (!isAnyEditorOpen) {
      router.back();
      return;
    }

    if (hasUnsavedTextChanges) {
      requestDiscard('screen');
      return;
    }

    router.back();
  };

  const handleAttemptCloseDoodleEditor = () => {
    if (hasUnsavedDoodleChanges) {
      requestDiscard('doodle');
      return;
    }

    setDoodleEditOpen(false);
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isAnyEditorOpen && !discardModalVisible) {
          router.back();
          return true;
        }

        if (discardModalVisible) {
          setDiscardModalVisible(false);
          setDiscardTarget(null);
          return true;
        }

        if (doodleEditOpen) {
          handleAttemptCloseDoodleEditor();
          return true;
        }

        if (hasUnsavedTextChanges) {
          requestDiscard('screen');
          return true;
        }

        return false;
      });

      return () => subscription.remove();
    }, [discardModalVisible, doodleEditOpen, hasUnsavedTextChanges, isAnyEditorOpen, router]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={handleAttemptScreenExit} hitSlop={12} style={styles.backButtonIcon}>
            <BackButtonIcon width={28.8} height={28.8} />
          </Pressable>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open thought menu"
            onPress={() => setMenuOpen((value) => !value)}
            hitSlop={12}>
            <MoreIcon />
          </Pressable>
        </View>

        <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
            <View style={styles.menuAnchor}>
              <Pressable accessibilityRole="button" onPress={handleDelete} style={styles.deleteMenu}>
                <View pointerEvents="none" style={styles.deleteMenuArrow} />
                <View style={styles.deleteMenuIconWrap}>
                  <DustbinIcon />
                </View>
                <Text style={styles.deleteMenuText}>Delete Thought</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            textEditOpen && {
              paddingBottom: 40 + keyboardOffset + 132,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.previewFrame}>
            <DoodlePreview strokes={thought.strokes} width={117.37} height={117.37} padding={12} />
          </View>

          {textEditOpen ? (
            <>
              <TextInput
                ref={titleInputRef}
                value={draftTitle}
                onChangeText={(text) => {
                  setDraftTitle(text);
                  requestAnimationFrame(() => {
                    if (activeField === 'title') {
                      scrollToCursor();
                    }
                  });
                }}
                selectionColor={COLORS.mainBlue}
                placeholder="What’s the logic behind usual things?"
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                style={styles.titleInput}
                multiline
                selection={titleSelection}
                onSelectionChange={(event) => setTitleSelection(event.nativeEvent.selection)}
                onFocus={() => {
                  setActiveField('title');
                  scrollToCursor();
                }}
                onLayout={(event) => {
                  titleInputY.current = event.nativeEvent.layout.y;
                }}
                onContentSizeChange={(event) => {
                  titleContentHeight.current = event.nativeEvent.contentSize.height;
                  if (activeField === 'title') {
                    scrollToCursor();
                  }
                }}
              />

              <TextInput
                ref={bodyInputRef}
                value={draftBody}
                onChangeText={(text) => {
                  setDraftBody(text);
                  requestAnimationFrame(() => {
                    if (activeField === 'body') {
                      scrollToCursor();
                    }
                  });
                }}
                selectionColor={COLORS.mainBlue}
                placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation"
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                style={styles.bodyInput}
                multiline
                textAlignVertical="top"
                selection={bodySelection}
                onSelectionChange={(event) => setBodySelection(event.nativeEvent.selection)}
                onFocus={() => {
                  setActiveField('body');
                  scrollToCursor();
                }}
                onLayout={(event) => {
                  bodyInputY.current = event.nativeEvent.layout.y;
                }}
                onContentSizeChange={(event) => {
                  bodyContentHeight.current = event.nativeEvent.contentSize.height;
                  if (activeField === 'body') {
                    scrollToCursor();
                  }
                }}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>{thought.title}</Text>

              {thought.body ? <Text style={styles.body}>{thought.body}</Text> : null}
            </>
          )}
        </ScrollView>

        {textEditOpen ? (
          <View style={[styles.editActionBar, { bottom: keyboardOffset }]}>
            <View style={styles.editActionCluster}>
              <Pressable accessibilityRole="button" accessibilityLabel="Open doodle editor" onPress={openDoodleEditor} style={styles.editActionSecondaryButton}>
                <FlowerIcon width={24.39} height={24.39} />
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel="Save thought" onPress={handleSaveText} style={styles.saveThoughtButton}>
              <CheckMarkIcon width={18.46} height={14.45} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit thought"
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.floatingEditButton,
              { bottom: 24 + keyboardOffset },
              pressed && styles.floatingEditButtonPressed,
            ]}>
            <View style={styles.flippedPencilWrap}>
              <View style={styles.editPencilIconWrap}>
                <PencilIcon width={28} height={28} color={COLORS.white} />
              </View>
            </View>
          </Pressable>
        )}
      </View>

      <Modal transparent visible={doodleEditOpen} animationType="fade" onRequestClose={handleAttemptCloseDoodleEditor}>
        <Pressable style={styles.editBackdrop} onPress={handleAttemptCloseDoodleEditor}>
          <Pressable style={styles.editSheet} onPress={() => {}}>
            <View style={styles.editHeader}>
              <View style={styles.editHeaderSpacer} />
              <Text style={styles.editHeaderTitle}>Edit Doodle</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close editor" onPress={handleAttemptCloseDoodleEditor} style={styles.editHeaderClose}>
                <CrossButtonIcon width={28} height={28} />
              </Pressable>
            </View>

            <View style={styles.editorBody}>
              <View style={styles.editorCanvas} {...panResponder.panHandlers}>
                <Svg
                  style={StyleSheet.absoluteFill}
                  viewBox={`0 0 ${DOODLE_COORDINATE_SIZE} ${DOODLE_COORDINATE_SIZE}`}
                  preserveAspectRatio="xMidYMid meet"
                  pointerEvents="none">
                  {editingStrokes.map((stroke, index) => (
                    <Path
                      key={`${index}-${stroke.points.length}`}
                      d={stroke.points.length > 0 ? `M ${stroke.points[0].x} ${stroke.points[0].y} ${stroke.points.slice(1).map((point) => `L ${point.x} ${point.y}`).join(' ')}` : ''}
                      stroke={stroke.color}
                      strokeWidth={stroke.width * (DOODLE_COORDINATE_SIZE / EDITOR_CANVAS_SIZE)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}
                </Svg>
              </View>

              <View style={styles.editorActions}>
                <View style={styles.editorPenEraserGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Pen"
                    onPress={() => setEditTool('pen')}
                    style={[styles.editorToolSegment, editTool === 'pen' && styles.editorToolSegmentActive]}>
                    <DoodlePencilIcon width={24.39} height={24.39} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Eraser"
                    onPress={() => setEditTool('eraser')}
                    style={[styles.editorToolSegment, editTool === 'eraser' && styles.editorToolSegmentActive]}>
                    <DoodleEraserIcon width={24.39} height={24.39} />
                  </Pressable>
                </View>

                <Pressable accessibilityRole="button" accessibilityLabel="Redo" onPress={handleDoodleHistoryPress} style={styles.editorRedoButton}>
                  <RedoIcon width={24.39} height={24.39} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save thought"
                  style={styles.editorSaveButton}
                  onPress={() => {
                    if (thought) {
                      updateThoughtStrokes(thought.id, editingStrokes);
                    }
                    setDoodleEditOpen(false);
                  }}>
                  <CheckMarkIcon width={18.46} height={14.45} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <DiscardConfirmModal
        visible={discardModalVisible}
        onStay={() => {
          setDiscardModalVisible(false);
          setDiscardTarget(null);
        }}
        onDiscard={() => {
          if (discardTarget === 'screen') {
            setDiscardModalVisible(false);
            setDiscardTarget(null);
            setTextEditOpen(false);
            router.back();
            return;
          }

          if (discardTarget === 'doodle') {
            setDiscardModalVisible(false);
            setDiscardTarget(null);
            setDoodleEditOpen(false);
            return;
          }

          setDiscardModalVisible(false);
          setDiscardTarget(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderRadius: 39,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  backButtonIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  dateLabel: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18.2,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 40,
  },
  previewFrame: {
    width: 149,
    height: 147,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    color: COLORS.black,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 34,
  },
  titleInput: {
    color: COLORS.black,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 34,
    padding: 0,
    margin: 0,
  },
  body: {
    marginTop: 24,
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 23.4,
  },
  bodyInput: {
    marginTop: 24,
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 23.4,
    padding: 0,
    marginHorizontal: 0,
    minHeight: 140,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    color: COLORS.black,
    fontSize: 20,
    fontWeight: '500',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 46, 255, 0.1)',
  },
  backButtonText: {
    color: COLORS.mainBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  floatingEditButton: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: COLORS.mainBlue,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingEditButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  flippedPencilWrap: {
    transform: [{ scaleX: -1 }],
  },
  editPencilIconWrap: {
    transform: [{ rotate: '0deg' }],
  },
  editActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 61,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F7F7F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editActionCluster: {
    width: 140,
    height: 37,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  editActionSecondaryButton: {
    width: 66.5,
    height: 37,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveThoughtButton: {
    width: 66.5,
    height: 37,
    borderRadius: 17,
    backgroundColor: COLORS.mainBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 19.4,
    elevation: 8,
  },
  menuAnchor: {
    position: 'absolute',
    top: 64,
    right: 24,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },
  deleteMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  deleteMenuArrow: {
    position: 'absolute',
    top: -6,
    right: 18,
    width: 12,
    height: 12,
    backgroundColor: COLORS.white,
    transform: [{ rotate: '45deg' }],
  },
  deleteMenuIconWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteMenuText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '500',
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editSheet: {
    width: 329,
    height: 435,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'space-between',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  editHeader: {
    alignSelf: 'stretch',
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editHeaderSpacer: {
    width: 28,
    height: 28,
  },
  editHeaderTitle: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 14,
    fontWeight: '400',
  },
  editHeaderClose: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorBody: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  editorCanvas: {
    width: EDITOR_CANVAS_SIZE,
    height: EDITOR_CANVAS_SIZE,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  editorActions: {
    width: 297,
    height: 41,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editorPenEraserGroup: {
    width: 123,
    height: 41,
    padding: 4,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  editorToolSegment: {
    flex: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorToolSegmentActive: {
    backgroundColor: '#DAE2FF',
  },
  editorRedoButton: {
    width: 63,
    height: 41,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  editorSaveButton: {
    width: 66.5,
    height: 44,
    borderRadius: 17,
    backgroundColor: COLORS.mainBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
});