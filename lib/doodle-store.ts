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

let currentDoodle: DoodleStroke[] | null = null;
let pendingThought: ThoughtDraft | null = null;
let savedThoughts: ThoughtNote[] = [];

export function saveDoodle(strokes: DoodleStroke[]) {
  currentDoodle = strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
}

export function saveThoughtDraft(draft: ThoughtDraft) {
  pendingThought = {
    title: draft.title.trim(),
    body: draft.body?.trim() || undefined,
  };
}

export function addSavedThought(strokes: DoodleStroke[]) {
  if (!pendingThought) {
    return;
  }

  const now = Date.now();
  const nextThought: ThoughtNote = {
    id: String(now),
    title: pendingThought.title,
    body: pendingThought.body,
    strokes: strokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point })),
    })),
    createdAt: now,
  };

  savedThoughts = [nextThought, ...savedThoughts];
  currentDoodle = nextThought.strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
  pendingThought = null;
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
}

export function updateThoughtStrokes(id: string, strokes: DoodleStroke[]) {
  savedThoughts = savedThoughts.map((thought) =>
    thought.id === id
      ? {
          ...thought,
          strokes: strokes.map((stroke) => ({
            ...stroke,
            points: stroke.points.map((point) => ({ ...point })),
          })),
        }
      : thought,
  );
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