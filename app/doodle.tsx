import React, { useRef, useState } from 'react';
import { View, PanResponder, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DOODLE_COORDINATE_SIZE, DOODLE_PEN_WIDTH, DOODLE_ERASER_WIDTH, EDITOR_CANVAS_SIZE } from '@/constants/doodle';
import type { DoodleStroke } from '@/lib/doodle-store';

export default function DoodleScreen() {
  const [strokes, setStrokes] = useState<DoodleStroke[]>([]);
  const current = useRef<DoodleStroke | null>(null);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (ev) => {
      const { locationX, locationY } = ev.nativeEvent;
      const scale = DOODLE_COORDINATE_SIZE / EDITOR_CANVAS_SIZE;
      const s: DoodleStroke = { points: [{ x: locationX * scale, y: locationY * scale }], color: '#392EFF', width: DOODLE_PEN_WIDTH };
      current.current = s;
      setStrokes((c) => [...c, s]);
    },
    onPanResponderMove: (ev) => {
      if (!current.current) return;
      const { locationX, locationY } = ev.nativeEvent;
      const scale = DOODLE_COORDINATE_SIZE / EDITOR_CANVAS_SIZE;
      current.current.points.push({ x: locationX * scale, y: locationY * scale });
      setStrokes((c) => {
        const next = [...c];
        next[next.length - 1] = { ...current.current! };
        return next;
      });
    },
    onPanResponderRelease: () => { current.current = null; },
  });

  return (
    <View style={styles.container}>
      <View style={styles.canvas} {...pan.panHandlers}>
        <Svg style={{flex:1}} viewBox={`0 0 ${DOODLE_COORDINATE_SIZE} ${DOODLE_COORDINATE_SIZE}`} preserveAspectRatio="xMidYMid meet">
          {strokes.map((s, i) => (
            <Path key={i} d={s.points.length ? `M ${s.points[0].x} ${s.points[0].y} ${s.points.slice(1).map(p=>`L ${p.x} ${p.y}`).join(' ')}` : ''} stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      <Pressable style={styles.done}><View><Text>Done</Text></View></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex:1, padding:12 }, canvas: { flex:1, backgroundColor:'#fff', borderRadius:12, overflow:'hidden' }, done: { height:52 } });
