export type Point = { x: number; y: number };
export type DoodleStroke = { points: Point[]; color: string; width: number };
export type Thought = { id: string; title: string; body?: string; createdAt: string; strokes: DoodleStroke[] };

let store: Thought[] = [
  {
    id: '1',
    title: "What's the logic behind usual things?",
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    createdAt: new Date().toISOString(),
    strokes: [],
  },
];

export function readThoughts() {
  return store;
}

export function readThought(id: string) {
  return store.find((t) => t.id === id);
}

export function createThought(title: string, body?: string) {
  const t: Thought = { id: `${Date.now()}-${Math.floor(Math.random()*10000)}`, title, body, createdAt: new Date().toISOString(), strokes: [] };
  store = [t, ...store];
  return t;
}

export function updateThoughtText(id: string, title: string, body?: string) {
  store = store.map((t) => (t.id === id ? { ...t, title, body } : t));
}

export function updateThoughtStrokes(id: string, strokes: DoodleStroke[]) {
  store = store.map((t) => (t.id === id ? { ...t, strokes } : t));
}

export function deleteThought(id: string) {
  store = store.filter((t) => t.id !== id);
}
