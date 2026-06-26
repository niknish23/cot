import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useRouter } from 'expo-router';

import { BackButtonIcon } from '@/components/icons/back-button-icon';
import { CheckMarkIcon } from '@/components/icons/check-mark-icon';
import { DoodleEraserIcon } from '@/components/icons/doodle-eraser-icon';
import { DoodlePencilIcon } from '@/components/icons/doodle-pencil-icon';
import { UndoIcon } from '@/components/icons/undo-icon';
import { DOODLE_COORDINATE_SIZE, DOODLE_ERASER_WIDTH, DOODLE_PEN_WIDTH } from '@/constants/doodle';
import { addSavedThought, saveDoodle, type DoodleStroke } from '@/lib/doodle-store';

type Tool = 'pen' | 'eraser';

type Point = {
  x: number;
  y: number;
};

const TOOL_BLUE = '#392EFF';
const CANVAS_WIDTH = 353;
const CANVAS_HEIGHT = 361;
const CANVAS_LEFT = 20;
const CANVAS_TOP = 163.2;

function buildPath(stroke: DoodleStroke) {
  if (stroke.points.length === 0) {
    return '';
  }

  const [firstPoint, ...rest] = stroke.points;
  const restPath = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');

  return restPath ? `M ${firstPoint.x} ${firstPoint.y} ${restPath}` : `M ${firstPoint.x} ${firstPoint.y}`;
}

function clampPoint(point: Point) {
  return {
    x: Math.max(0, Math.min(DOODLE_COORDINATE_SIZE, point.x)),
    y: Math.max(0, Math.min(DOODLE_COORDINATE_SIZE, point.y)),
  };
}

export default function DoodleScreen() {
  const router = useRouter();
  const [tool, setTool] = useState<Tool>('pen');
  const [strokes, setStrokes] = useState<DoodleStroke[]>([]);
  const activeStrokeRef = useRef<DoodleStroke | null>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });

    return () => subscription.remove();
  }, [router]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const xScale = DOODLE_COORDINATE_SIZE / CANVAS_WIDTH;
          const yScale = DOODLE_COORDINATE_SIZE / CANVAS_HEIGHT;

          const nextStroke: DoodleStroke = {
            points: [clampPoint({ x: locationX * xScale, y: locationY * yScale })],
            color: TOOL_BLUE,
            width: tool === 'eraser' ? DOODLE_ERASER_WIDTH : DOODLE_PEN_WIDTH,
          };

          activeStrokeRef.current = nextStroke;
          setStrokes((currentStrokes) => [...currentStrokes, nextStroke]);
        },
        onPanResponderMove: (event) => {
          const activeStroke = activeStrokeRef.current;
          if (!activeStroke) {
            return;
          }

          const { locationX, locationY } = event.nativeEvent;
          const xScale = DOODLE_COORDINATE_SIZE / CANVAS_WIDTH;
          const yScale = DOODLE_COORDINATE_SIZE / CANVAS_HEIGHT;
          const nextPoint = clampPoint({ x: locationX * xScale, y: locationY * yScale });

          const updatedStroke: DoodleStroke = {
            ...activeStroke,
            points: [...activeStroke.points, nextPoint],
          };

          activeStrokeRef.current = updatedStroke;
          setStrokes((currentStrokes) => {
            if (currentStrokes.length === 0) {
              return [updatedStroke];
            }

            const nextStrokes = [...currentStrokes];
            nextStrokes[nextStrokes.length - 1] = updatedStroke;
            return nextStrokes;
          });
        },
        onPanResponderRelease: () => {
          activeStrokeRef.current = null;
        },
        onPanResponderTerminate: () => {
          activeStrokeRef.current = null;
        },
      }),
    [tool],
  );

  const handleUndo = () => {
    setStrokes((currentStrokes) => {
      if (currentStrokes.length === 0) {
        return currentStrokes;
      }

      const nextStrokes = [...currentStrokes];
      nextStrokes.pop();

      return nextStrokes;
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleDone = () => {
    addSavedThought(strokes);
    saveDoodle(strokes);
    router.replace('/?thoughtAdded=1');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.headerBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={handleBack} style={styles.headerButton}>
            <BackButtonIcon width={28.8} height={28.8} />
          </Pressable>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.promptWrap}>
          <Text style={styles.promptText}>Doodle something for this thought</Text>
        </View>

        <View style={styles.canvasWrap} {...panResponder.panHandlers}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${DOODLE_COORDINATE_SIZE} ${DOODLE_COORDINATE_SIZE}`} preserveAspectRatio="none">
            {strokes.map((stroke, index) => (
              <Path
                key={`${index}-${stroke.points.length}`}
                d={buildPath(stroke)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        </View>

        <View style={styles.toolbarRow}>
          <View style={styles.toolCluster}>
            <View style={styles.segmentedToolPill}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pen tool"
                onPress={() => setTool('pen')}
                style={[styles.segmentedTool, styles.segmentedToolLeft, tool === 'pen' && styles.segmentedToolActive]}>
                <DoodlePencilIcon />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eraser tool"
                onPress={() => setTool('eraser')}
                style={[styles.segmentedTool, styles.segmentedToolRight, tool === 'eraser' && styles.segmentedToolActive]}>
                <DoodleEraserIcon />
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel="Undo" onPress={handleUndo} style={styles.smallToolButton}>
              <UndoIcon />
            </Pressable>

          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Save doodle" onPress={handleDone} style={styles.doneButton}>
            <CheckMarkIcon />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: 39,
  },
  headerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 11,
    height: 73,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 68.82,
    paddingHorizontal: 73,
    alignItems: 'flex-start',
  },
  promptText: {
    opacity: 0.5,
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
  },
  canvasWrap: {
    position: 'absolute',
    left: CANVAS_LEFT,
    top: 123.2,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
    borderRadius: 25,
  },
  toolbarRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 501.58,
    height: 73,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolCluster: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  segmentedToolPill: {
    width: 123,
    height: 41,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  segmentedTool: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedToolLeft: {
    backgroundColor: '#FFFFFF',
  },
  segmentedToolRight: {
    backgroundColor: '#DAE2FF',
  },
  segmentedToolActive: {
    backgroundColor: '#DAE2FF',
  },
  smallToolButton: {
    width: 49,
    height: 41,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  doneButton: {
    width: 66.5,
    height: 41,
    backgroundColor: TOOL_BLUE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: TOOL_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
