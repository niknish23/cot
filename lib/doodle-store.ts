import AsyncStorage from '@react-native-async-storage/async-storage';

export type Point = {
  x: number;
  y: number;
};

export type DoodleStroke = {
  points: Point[];
  color: string;
  width: number;
};

export type ThoughtNote = {
  id: string;
  title: string;
  body?: string;
  strokes: DoodleStroke[];
  createdAt: number;
};

export type ThoughtDraft = {
  title: string;
  body?: string;
};

const THOUGHTS_STORAGE_KEY = 'saved-thoughts-v1';

let currentDoodle: DoodleStroke[] | null = null;
let pendingThought: ThoughtDraft | null = null;
let pendingThoughtCreatedAt: number | null = null;
let savedThoughts: ThoughtNote[] = [];
let hydratePromise: Promise<void> | null = null;

function cloneStrokes(strokes: DoodleStroke[]) {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
}

function isThoughtNote(value: unknown): value is ThoughtNote {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const thought = value as ThoughtNote;

  return (
    typeof thought.id === 'string' &&
    typeof thought.title === 'string' &&
    (thought.body === undefined || typeof thought.body === 'string') &&
    Array.isArray(thought.strokes) &&
    typeof thought.createdAt === 'number'
  );
}

function parseStoredThoughts(raw: string) {
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isThoughtNote);
}

async function persistThoughts() {
  await AsyncStorage.setItem(THOUGHTS_STORAGE_KEY, JSON.stringify(savedThoughts));
}

export async function hydrateThoughts() {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const raw = await AsyncStorage.getItem(THOUGHTS_STORAGE_KEY);

      if (!raw) {
        return;
      }

      try {
        savedThoughts = parseStoredThoughts(raw);
      } catch {
        savedThoughts = [];
      }
    })();
  }

  return hydratePromise;
}

export function saveDoodle(strokes: DoodleStroke[]) {
  currentDoodle = cloneStrokes(strokes);
}

export function saveThoughtDraft(draft: ThoughtDraft) {
  pendingThought = {
    title: draft.title.trim(),
    body: draft.body?.trim() || undefined,
  };
}

function resolveCreatedAtTimestamp() {
  if (pendingThoughtCreatedAt == null) {
    return Date.now();
  }

  const targetDate = new Date(pendingThoughtCreatedAt);
  const now = new Date();

  return new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  ).getTime();
}

export function setPendingThoughtDate(date: Date | null) {
  pendingThoughtCreatedAt = date ? date.getTime() : null;
}

export function clearPendingThoughtDate() {
  pendingThoughtCreatedAt = null;
}

export function addSavedThought(strokes: DoodleStroke[]) {
  if (!pendingThought) {
    return;
  }

  const createdAt = resolveCreatedAtTimestamp();
  const nextThought: ThoughtNote = {
    id: String(Date.now()),
    title: pendingThought.title,
    body: pendingThought.body,
    strokes: cloneStrokes(strokes),
    createdAt,
  };

  savedThoughts = [nextThought, ...savedThoughts];
  currentDoodle = cloneStrokes(nextThought.strokes);
  pendingThought = null;
  pendingThoughtCreatedAt = null;
  void persistThoughts();
}

export function readThoughts() {
  return [...savedThoughts].sort((left, right) => {
    const leftHasBody = Boolean(left.body);
    const rightHasBody = Boolean(right.body);

    if (leftHasBody !== rightHasBody) {
      return leftHasBody ? 1 : -1;
    }

    return right.createdAt - left.createdAt;
  });
}

export function deleteThought(id: string) {
  savedThoughts = savedThoughts.filter((thought) => thought.id !== id);
  void persistThoughts();
}

export function updateThoughtStrokes(id: string, strokes: DoodleStroke[]) {
  savedThoughts = savedThoughts.map((thought) =>
    thought.id === id
      ? {
          ...thought,
          strokes: cloneStrokes(strokes),
        }
      : thought,
  );
  void persistThoughts();
}

export function updateThoughtText(id: string, title: string, body?: string) {
  savedThoughts = savedThoughts.map((thought) =>
    thought.id === id
      ? {
          ...thought,
          title: title.trim(),
          body: body?.trim() || undefined,
        }
      : thought,
  );
  void persistThoughts();
}

export function readPendingThought() {
  return pendingThought;
}

export function readDoodle() {
  return currentDoodle;
}

export function clearDoodle() {
  currentDoodle = null;
}
