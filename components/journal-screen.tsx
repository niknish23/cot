import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DoodlePreview } from '@/components/doodle-preview';
import { BackButtonIcon } from '@/components/icons/back-button-icon';
import { ChatIcon } from '@/components/icons/chat-icon';
import { CotLogo } from '@/components/icons/cot-logo';
import { DiaryIcon } from '@/components/icons/diary-icon';
import { EmptyCalendarIcon } from '@/components/icons/empty-calendar-icon';
import { NoThoughtsIcon } from '@/components/icons/no-thoughts-icon';
import { PlusIcon } from '@/components/icons/plus-icon';
import { SearchIcon } from '@/components/icons/search-icon';
import { clearPendingThoughtDate, hydrateThoughts, readThoughts, setPendingThoughtDate, type ThoughtNote } from '@/lib/doodle-store';
import { useResponsiveLayout } from '@/lib/responsive-layout';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  cardBlue: '#DAE2FF',
  slightWhite: '#F7F7F7',
  borderBlack20: 'rgba(0, 0, 0, 0.20)',
};

type JournalTab = 'chat' | 'diary';

type CalendarCellItem = {
  date: Date;
  notes: ThoughtNote[];
  isToday: boolean;
};

type SelectedDiaryDay = {
  date: Date;
  notes: ThoughtNote[];
};

type CalendarMonth = {
  name: string;
  thoughtsCount: number;
  weeks: Array<Array<CalendarCellItem | null>>;
};

type CalendarDay = {
  date: Date;
  notes: ThoughtNote[];
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayHeader(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function buildDateSearchTokens(createdAt: number) {
  const date = new Date(createdAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const monthPadded = String(month).padStart(2, '0');
  const dayPadded = String(day).padStart(2, '0');

  const longLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
    .format(date)
    .toLowerCase();

  const shortLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
    .format(date)
    .toLowerCase();

  return [
    longLabel,
    shortLabel,
    `${month}/${day}/${year}`,
    `${monthPadded}/${dayPadded}/${year}`,
    `${day}/${month}/${year}`,
    `${dayPadded}/${monthPadded}/${year}`,
    `${year}-${monthPadded}-${dayPadded}`,
  ];
}

function noteMatchesSearch(note: ThoughtNote, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const textBlob = `${note.title} ${note.body ?? ''}`.toLowerCase();
  if (textBlob.includes(normalizedQuery)) {
    return true;
  }

  return buildDateSearchTokens(note.createdAt).some((token) => token.includes(normalizedQuery));
}

function buildCalendarMonths(notes: ThoughtNote[], year: number): CalendarMonth[] {
  const today = new Date();

  return MONTH_NAMES.map((name, monthIndex) => {
    const monthNotes = notes.filter((note) => {
      const noteDate = new Date(note.createdAt);
      return noteDate.getFullYear() === year && noteDate.getMonth() === monthIndex;
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const cells: Array<CalendarDay | null> = [];

    for (let emptyIndex = 0; emptyIndex < firstDayIndex; emptyIndex += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      const dayNotes = monthNotes.filter((note) => isSameDay(new Date(note.createdAt), date));
      cells.push({ date, notes: dayNotes });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: Array<Array<CalendarCellItem | null>> = [];

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 7) {
      weeks.push(
        cells.slice(cellIndex, cellIndex + 7).map((cell) => {
          if (!cell) {
            return null;
          }

          const isToday = isSameDay(cell.date, today);

          return {
            date: cell.date,
            notes: cell.notes,
            isToday,
          };
        }),
      );
    }

    return {
      name,
      thoughtsCount: monthNotes.length,
      weeks,
    };
  });
}

function DayThoughtCardItem({
  card,
  onPress,
}: {
  card: ThoughtNote;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(card.id)}
      style={({ pressed }) => [styles.dayCard, pressed && styles.cardPressed]}>
      <View style={styles.dayCardPreviewWrap}>
        <DoodlePreview strokes={card.strokes} width={40} height={42} padding={8} />
      </View>
      <Text style={styles.dayCardText}>{card.title}</Text>
    </Pressable>
  );
}

function DayThoughtsPane({
  date,
  notes,
  onBack,
  onCardPress,
  onAddThought,
  bottomInset,
}: {
  date: Date;
  notes: ThoughtNote[];
  onBack: () => void;
  onCardPress: (id: string) => void;
  onAddThought: () => void;
  bottomInset: number;
}) {
  return (
    <View style={styles.pane}>
      <View style={styles.dayHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to calendar"
          onPress={onBack}
          style={({ pressed }) => [styles.dayHeaderBackButton, pressed && styles.headerActionPressed]}>
          <BackButtonIcon width={24} height={24} />
        </Pressable>
        <Text style={styles.dayHeaderDate}>{formatDayHeader(date)}</Text>
        <View style={styles.dayHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.dayScrollContent, { paddingBottom: 120 + bottomInset }]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.dayGrid}>
          <View style={styles.dayColumn}>
            {notes
              .filter((_, index) => index % 2 === 0)
              .map((card) => (
                <DayThoughtCardItem key={card.id} card={card} onPress={onCardPress} />
              ))}
          </View>
          <View style={styles.dayColumn}>
            {notes
              .filter((_, index) => index % 2 === 1)
              .map((card) => (
                <DayThoughtCardItem key={card.id} card={card} onPress={onCardPress} />
              ))}
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add thought for this day"
        onPress={onAddThought}
        style={({ pressed }) => [
          styles.dayFab,
          { bottom: 24 + bottomInset },
          pressed && styles.dayFabPressed,
        ]}>
        <PlusIcon width={32} height={32} color={COLORS.white} />
      </Pressable>
    </View>
  );
}

function DayThoughtsSheet({
  date,
  notes,
  onClose,
  onCardPress,
  onAddThought,
  bottomInset,
}: {
  date: Date;
  notes: ThoughtNote[];
  onClose: () => void;
  onCardPress: (id: string) => void;
  onAddThought: () => void;
  bottomInset: number;
}) {
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.88, height - 48);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [backdropOpacity, onClose, sheetHeight, translateY]);

  useEffect(() => {
    translateY.setValue(sheetHeight);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetHeight, translateY]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      animateClose();
      return true;
    });

    return () => subscription.remove();
  }, [animateClose]);

  return (
    <View style={styles.daySheetOverlay} pointerEvents="box-none">
      <Pressable style={styles.daySheetBackdropPressable} onPress={animateClose}>
        <Animated.View style={[styles.daySheetBackdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.daySheet,
          {
            height: sheetHeight,
            transform: [{ translateY }],
          },
        ]}>
        <DayThoughtsPane
          bottomInset={bottomInset}
          date={date}
          notes={notes}
          onAddThought={onAddThought}
          onBack={animateClose}
          onCardPress={onCardPress}
        />
      </Animated.View>
    </View>
  );
}

function ThoughtCardItem({
  card,
  onPress,
}: {
  card: ThoughtNote;
  onPress: (id: string) => void;
}) {
  const isBlue = Boolean(card.body);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(card.id)}
      style={({ pressed }) => [
        styles.card,
        isBlue ? styles.cardBlue : styles.cardGray,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.cardIconContainer}>
        <View style={styles.cardPreviewFrame}>
          <DoodlePreview strokes={card.strokes} width={86} height={56} padding={8} />
        </View>
      </View>
      <Text style={styles.cardText}>{card.title}</Text>
    </Pressable>
  );
}

function EmptyThoughtsState({ scale }: { scale: number }) {
  const artTop = (269.12 - 104) * scale;
  const textGap = (394.5 - (269.12 + 107)) * scale;

  return (
    <View style={[styles.emptyStateContainer, { paddingTop: artTop }]}>
      <View style={styles.emptyStateArt}>
        <NoThoughtsIcon />
      </View>

      <View style={[styles.emptyMessage, { marginTop: textGap }]}>
        <Text style={[styles.emptyTitle, { fontSize: 26 * scale, lineHeight: 31.2 * scale }]}>No thoughts...</Text>
        <Text style={[styles.emptySubtitle, { fontSize: 16 * scale, lineHeight: 19.2 * scale }]}>Start a new thought!</Text>
      </View>
    </View>
  );
}

function CalendarCellIcon({ cell }: { cell: CalendarCellItem }) {
  if (cell.notes.length > 0) {
    return (
      <DoodlePreview
        strokes={cell.notes[0].strokes}
        width={28}
        height={28}
        padding={2}
        strokeColor={cell.isToday ? COLORS.white : undefined}
      />
    );
  }

  return <EmptyCalendarIcon strokeColor={cell.isToday ? COLORS.white : undefined} />;
}

function CalendarMonthSection({
  month,
  onDayPress,
  onLayout,
}: {
  month: CalendarMonth;
  onDayPress: (date: Date, notes: ThoughtNote[]) => void;
  onLayout?: (event: any) => void;
}) {
  return (
    <View style={styles.monthSection} onLayout={onLayout}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthName}>{month.name}</Text>
        <Text style={styles.monthCount}>{month.thoughtsCount} thoughts</Text>
      </View>

      <View style={styles.calendarGrid}>
        {month.weeks.map((week, weekIndex) => (
          <View key={`${month.name}-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return <View key={`${month.name}-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
              }

              const dayCellStyle = [styles.dayCell, day.isToday && styles.dayCellToday];

              if (day.notes.length === 0) {
                return (
                  <View key={`${month.name}-${weekIndex}-${dayIndex}`} style={dayCellStyle}>
                    <CalendarCellIcon cell={day} />
                  </View>
                );
              }

              return (
                <Pressable
                  key={`${month.name}-${weekIndex}-${dayIndex}`}
                  accessibilityRole="button"
                  accessibilityLabel={`View thoughts for ${formatDayHeader(day.date)}`}
                  onPress={() => onDayPress(day.date, day.notes)}
                  style={({ pressed }) => [dayCellStyle, pressed && styles.dayCellPressed]}>
                  <CalendarCellIcon cell={day} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function BottomNavButton({
  variant,
  onPress,
  active = false,
  scale = 1,
  children,
}: {
  variant: 'chat' | 'add' | 'profile';
  onPress: () => void;
  active?: boolean;
  scale?: number;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        active && styles.navButtonActive,
        variant === 'add' && [styles.navButtonAdd, { borderRadius: 23 * scale }],
        pressed && styles.navButtonPressed,
      ]}>
      {children}
    </Pressable>
  );
}

function ThoughtsGridPane({
  notes,
  onCardPress,
  emptyTitle,
  emptySubtitle,
  horizontalPadding,
  bottomContentPadding,
}: {
  notes: ThoughtNote[];
  onCardPress: (id: string) => void;
  emptyTitle: string;
  emptySubtitle: string;
  horizontalPadding: number;
  bottomContentPadding: number;
}) {
  if (notes.length === 0) {
    return (
      <View style={styles.pane}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.emptyScrollContent, { paddingBottom: bottomContentPadding }]}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View style={styles.searchEmptyStateContainer}>
            <Text style={styles.searchEmptyTitle}>{emptyTitle}</Text>
            <Text style={styles.searchEmptySubtitle}>{emptySubtitle}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.pane}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, paddingBottom: bottomContentPadding },
        ]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <View style={styles.column}>
            {notes
              .filter((_, index) => index % 2 === 0)
              .map((card) => (
                <ThoughtCardItem key={card.id} card={card} onPress={onCardPress} />
              ))}
          </View>
          <View style={styles.column}>
            {notes
              .filter((_, index) => index % 2 === 1)
              .map((card) => (
                <ThoughtCardItem key={card.id} card={card} onPress={onCardPress} />
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ChatPane({
  notes,
  onCardPress,
  scale,
  horizontalPadding,
  bottomContentPadding,
}: {
  notes: ThoughtNote[];
  onCardPress: (id: string) => void;
  scale: number;
  horizontalPadding: number;
  bottomContentPadding: number;
}) {
  if (notes.length === 0) {
    return (
      <View style={styles.pane}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.emptyScrollContent, { paddingBottom: bottomContentPadding }]}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <EmptyThoughtsState scale={scale} />
        </ScrollView>
      </View>
    );
  }

  return (
    <ThoughtsGridPane
      notes={notes}
      onCardPress={onCardPress}
      emptyTitle="No thoughts..."
      emptySubtitle="Start a new thought!"
      horizontalPadding={horizontalPadding}
      bottomContentPadding={bottomContentPadding}
    />
  );
}

function DiaryPane({
  notes,
  active,
  onDayPress,
  horizontalPadding,
  bottomContentPadding,
}: {
  notes: ThoughtNote[];
  active: boolean;
  onDayPress: (date: Date, dayNotes: ThoughtNote[]) => void;
  horizontalPadding: number;
  bottomContentPadding: number;
}) {
  const months = useMemo(() => buildCalendarMonths(notes, 2026), [notes]);
  const scrollViewRef = useRef<ScrollView>(null);
  const monthLayouts = useRef<Record<number, number>>({});
  const currentMonthIndex = useMemo(() => new Date().getMonth(), []);

  const scrollToCurrentMonth = () => {
    const targetY = monthLayouts.current[currentMonthIndex];

    if (targetY == null) {
      return;
    }

    scrollViewRef.current?.scrollTo({ y: Math.max(targetY - 12, 0), animated: false });
  };

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setTimeout(() => {
      scrollToCurrentMonth();
    }, 0);

    return () => clearTimeout(timer);
  }, [active, months]);

  return (
    <View style={styles.pane}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, paddingBottom: bottomContentPadding },
        ]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <Text style={styles.yearTitle}>2026</Text>
          {months.map((month, monthIndex) => (
            <CalendarMonthSection
              key={month.name}
              month={month}
              onDayPress={onDayPress}
              onLayout={(event) => {
                monthLayouts.current[monthIndex] = event.nativeEvent.layout.y;

                if (active && monthIndex === currentMonthIndex) {
                  scrollToCurrentMonth();
                }
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function JournalScreen({ initialTab, onThoughtPress }: { initialTab: JournalTab; onThoughtPress?: (id: string) => void }) {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { insets, scale, bottomNavOffset, bottomContentPadding, horizontalPadding, headerHeight, contentMaxWidth } = layout;
  const [activeTab, setActiveTab] = useState<JournalTab>(initialTab);
  const [contentWidth, setContentWidth] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOriginTab, setSearchOriginTab] = useState<JournalTab>(initialTab);
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const [selectedDiaryDay, setSelectedDiaryDay] = useState<SelectedDiaryDay | null>(null);
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const overlayX = useRef(new Animated.Value(0)).current;
  const searchTransition = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const [notesVersion, setNotesVersion] = useState(0);
  const notes = useMemo(() => {
    void notesVersion;
    return readThoughts();
  }, [notesVersion]);
  const normalizedSearchQuery = searchQuery.trim();
  const searchResults = useMemo(() => notes.filter((note) => noteMatchesSearch(note, searchQuery)), [notes, searchQuery]);
  const showSearchResults = searchMode && normalizedSearchQuery.length > 0;

  const closeSearchToChat = useCallback(() => {
    Keyboard.dismiss();
    setSearchMode(false);
    setSearchQuery('');
    setSearchInputFocused(false);
    setActiveTab('chat');
  }, []);

  const closeSearchToOrigin = useCallback(() => {
    Keyboard.dismiss();
    setSearchMode(false);
    setSearchQuery('');
    setSearchInputFocused(false);
    setActiveTab(searchOriginTab);
  }, [searchOriginTab]);

  useFocusEffect(
    useCallback(() => {
      void hydrateThoughts().then(() => {
        setNotesVersion((version) => version + 1);
      });
    }, []),
  );

  useEffect(() => {
    if (!selectedDiaryDay) {
      return;
    }

    const updatedNotes = readThoughts()
      .filter((note) => isSameDay(new Date(note.createdAt), selectedDiaryDay.date))
      .sort((left, right) => right.createdAt - left.createdAt);

    setSelectedDiaryDay((current) => {
      if (!current) {
        return null;
      }

      const hasSameNotes =
        current.notes.length === updatedNotes.length &&
        current.notes.every((note, index) => note.id === updatedNotes[index]?.id);

      if (hasSameNotes) {
        return current;
      }

      return {
        date: current.date,
        notes: updatedNotes,
      };
    });
  }, [notesVersion, selectedDiaryDay?.date]);

  useEffect(() => {
    Animated.timing(searchTransition, {
      toValue: searchMode ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [searchMode, searchTransition]);

  useEffect(() => {
    if (!searchMode) {
      return;
    }

    const focusHandle = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(focusHandle);
  }, [searchMode]);

  useEffect(() => {
    // Automatically retract when search isn't actively being used.
    if (!searchMode || (!searchInputFocused && normalizedSearchQuery.length === 0)) {
      Keyboard.dismiss();
    }
  }, [normalizedSearchQuery.length, searchInputFocused, searchMode]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!searchMode) {
          return false;
        }

        if (normalizedSearchQuery.length === 0) {
          closeSearchToChat();
          return true;
        }

        closeSearchToOrigin();
        return true;
      });

      return () => subscription.remove();
    }, [closeSearchToChat, closeSearchToOrigin, normalizedSearchQuery.length, searchMode]),
  );

  useEffect(() => {
    if (!contentWidth || !barWidth) {
      return;
    }

    const targetContentX = activeTab === 'chat' ? 0 : -contentWidth;
    const segmentWidth = (barWidth - 24 * scale - 22 * scale) / 3;
    const targetOverlayX = activeTab === 'chat' ? 0 : (segmentWidth + 11 * scale) * 2;

    Animated.parallel([
      Animated.timing(contentTranslateX, {
        toValue: targetContentX,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayX, {
        toValue: targetOverlayX,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, barWidth, contentTranslateX, contentWidth, overlayX, scale]);

  const segmentWidth = barWidth ? (barWidth - 24 * scale - 22 * scale) / 3 : 0;

  const handleDiaryDayPress = useCallback((date: Date, dayNotes: ThoughtNote[]) => {
    setSelectedDiaryDay({
      date,
      notes: [...dayNotes].sort((left, right) => right.createdAt - left.createdAt),
    });
  }, []);

  const handleAddThoughtForDay = useCallback(() => {
    if (!selectedDiaryDay) {
      return;
    }

    setPendingThoughtDate(selectedDiaryDay.date);
    router.push('/new-thought');
  }, [router, selectedDiaryDay]);

  const closeDiaryDaySheet = useCallback(() => {
    setSelectedDiaryDay(null);
    clearPendingThoughtDate();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.headerShell, { height: headerHeight }]}>
          <Animated.View
            pointerEvents={searchMode ? 'none' : 'auto'}
            style={[
              styles.header,
              {
                paddingHorizontal: horizontalPadding,
                paddingVertical: 12 * scale,
                opacity: searchTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [
                  {
                    translateX: searchTransition.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }),
                  },
                ],
              },
            ]}>
            <CotLogo />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search"
              style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
              onPress={() => {
                setSearchOriginTab(activeTab);
                setSearchMode(true);
              }}>
              <SearchIcon />
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={searchMode ? 'auto' : 'none'}
            style={[
              styles.header,
              styles.headerSearchSnippet,
              {
                paddingHorizontal: horizontalPadding,
                paddingVertical: 12 * scale,
                opacity: searchTransition,
                transform: [
                  {
                    translateX: searchTransition.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
                  },
                ],
              },
            ]}>
            <View style={styles.searchSnippetLeftGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back from search"
                style={({ pressed }) => [styles.searchSnippetBackButton, pressed && styles.headerActionPressed]}
                onPress={() => {
                  if (normalizedSearchQuery.length === 0) {
                    closeSearchToChat();
                    return;
                  }

                  closeSearchToOrigin();
                }}>
                <BackButtonIcon width={24} height={24} />
              </Pressable>

              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search..."
                placeholderTextColor="rgba(0, 0, 0, 0.50)"
                style={styles.searchSnippetInput}
                selectionColor={COLORS.mainBlue}
                returnKeyType="search"
                onFocus={() => setSearchInputFocused(true)}
                onBlur={() => {
                  setSearchInputFocused(false);
                  Keyboard.dismiss();
                }}
              />
            </View>

            <View style={styles.searchSnippetRightIcon}>
              <SearchIcon width={18.44} height={20.9} />
            </View>
          </Animated.View>
        </View>

        <View
          style={[styles.contentViewport, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width !== contentWidth) {
              setContentWidth(width);
            }
          }}>
          {showSearchResults ? (
            <ThoughtsGridPane
              notes={searchResults}
              onCardPress={onThoughtPress ?? (() => {})}
              emptyTitle="No matching thoughts"
              emptySubtitle="Try a keyword or a date like 3/12/2026"
              horizontalPadding={horizontalPadding}
              bottomContentPadding={bottomContentPadding}
            />
          ) : (
            <Animated.View
              style={[
                styles.slidingRow,
                {
                  width: contentWidth ? contentWidth * 2 : undefined,
                  transform: [{ translateX: contentTranslateX }],
                },
              ]}>
              <ChatPane
                notes={notes}
                onCardPress={onThoughtPress ?? (() => {})}
                scale={scale}
                horizontalPadding={horizontalPadding}
                bottomContentPadding={bottomContentPadding}
              />
              <DiaryPane
                notes={notes}
                active={activeTab === 'diary'}
                onDayPress={handleDiaryDayPress}
                horizontalPadding={horizontalPadding}
                bottomContentPadding={bottomContentPadding}
              />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>

      <View style={[styles.bottomBarWrapper, { bottom: bottomNavOffset, paddingHorizontal: 53 * scale }]}>
        <View
          style={[
            styles.bottomBar,
            {
              maxWidth: 287 * scale,
              height: 79 * scale,
              padding: 12 * scale,
              gap: 11 * scale,
              borderRadius: 34 * scale,
            },
          ]}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width !== barWidth) {
              setBarWidth(width);
            }
          }}>
          {barWidth ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.navButtonOverlay,
                {
                  width: segmentWidth,
                  left: 12 * scale,
                  top: 12 * scale,
                  bottom: 12 * scale,
                  borderRadius: 22 * scale,
                  transform: [{ translateX: overlayX }],
                },
              ]}
            />
          ) : null}
          <BottomNavButton variant="chat" active={activeTab === 'chat'} scale={scale} onPress={() => setActiveTab('chat')}>
            <ChatIcon width={32 * scale} height={32 * scale} />
          </BottomNavButton>
          <BottomNavButton
            variant="add"
            scale={scale}
            onPress={() => {
              clearPendingThoughtDate();
              router.push('/new-thought');
            }}>
            <PlusIcon width={32 * scale} height={32 * scale} />
          </BottomNavButton>
          <BottomNavButton variant="profile" active={activeTab === 'diary'} scale={scale} onPress={() => setActiveTab('diary')}>
            <DiaryIcon width={32 * scale} height={32 * scale} />
          </BottomNavButton>
        </View>
      </View>

      {searchMode && normalizedSearchQuery.length === 0 ? (
        <Pressable
          style={[styles.searchDismissOverlay, { top: insets.top + headerHeight }]}
          onPress={() => {
            closeSearchToChat();
          }}
        />
      ) : null}

      {selectedDiaryDay ? (
        <DayThoughtsSheet
          bottomInset={insets.bottom + 10}
          date={selectedDiaryDay.date}
          notes={selectedDiaryDay.notes}
          onAddThought={handleAddThoughtForDay}
          onCardPress={onThoughtPress ?? (() => {})}
          onClose={closeDiaryDaySheet}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
  },
  headerShell: {
    zIndex: 30,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderBlack20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSearchSnippet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerAction: {
    padding: 4,
  },
  searchSnippetLeftGroup: {
    width: 200.78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  searchSnippetBackButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSnippetInput: {
    flex: 1,
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  searchSnippetRightIcon: {
    width: 18.44,
    height: 20.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: {
    opacity: 0.6,
  },
  searchDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 53,
    zIndex: 20,
  },
  contentViewport: {
    flex: 1,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  slidingRow: {
    flexDirection: 'row',
    flex: 1,
  },
  pane: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 120,
  },
  emptyScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 120,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  emptyStateArt: {
    alignItems: 'center',
  },
  emptyMessage: {
    alignItems: 'center',
    gap: 13,
    opacity: 0.5,
  },
  emptyTitle: {
    width: 188.71,
    textAlign: 'center',
    color: '#392EFF',
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 31.2,
  },
  emptySubtitle: {
    alignSelf: 'stretch',
    textAlign: 'center',
    color: '#392EFF',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19.2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  dayHeaderBackButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderDate: {
    opacity: 0.5,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18.2,
  },
  dayHeaderSpacer: {
    width: 24,
    height: 24,
  },
  dayScrollContent: {
    paddingTop: 18,
    paddingHorizontal: 34.5,
    paddingBottom: 120,
  },
  daySheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'flex-end',
  },
  daySheetBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  daySheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  daySheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 39,
    borderTopRightRadius: 39,
    overflow: 'hidden',
  },
  dayFab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  dayFabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  dayGrid: {
    flexDirection: 'row',
    gap: 16,
    maxWidth: 324,
    alignSelf: 'center',
    width: '100%',
  },
  dayColumn: {
    flex: 1,
    gap: 16,
  },
  dayCard: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: COLORS.slightWhite,
    borderRadius: 19,
    alignItems: 'center',
    gap: 12,
  },
  dayCardPreviewWrap: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardText: {
    width: '100%',
    textAlign: 'center',
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '500',
  },
  searchEmptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  searchEmptyTitle: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchEmptySubtitle: {
    color: 'rgba(0, 0, 0, 0.55)',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  card: {
    padding: 12,
    borderRadius: 34,
    alignItems: 'center',
    gap: 12,
    minHeight: 158,
  },
  cardBlue: {
    backgroundColor: COLORS.cardBlue,
  },
  cardGray: {
    backgroundColor: COLORS.slightWhite,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIconContainer: {
    width: '100%',
    height: 72,
  },
  cardPreviewFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    textAlign: 'center',
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 17.6,
  },
  calendarCard: {
    gap: 12,
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
  },
  monthSection: {
    gap: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
  },
  monthCount: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.mainBlue,
    opacity: 0.7,
  },
  calendarGrid: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dayCellToday: {
    backgroundColor: COLORS.mainBlue,
    borderRadius: 16,
  },
  dayCellPressed: {
    opacity: 0.75,
  },
  bottomBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 19.4,
    elevation: 8,
    overflow: 'hidden',
  },
  navButtonOverlay: {
    position: 'absolute',
    left: 12,
    top: 12,
    bottom: 12,
    backgroundColor: COLORS.cardBlue,
    borderRadius: 22,
  },
  navButton: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  navButtonActive: {
    backgroundColor: 'transparent',
  },
  navButtonAdd: {
    backgroundColor: COLORS.mainBlue,
    borderRadius: 23,
  },
  navButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});