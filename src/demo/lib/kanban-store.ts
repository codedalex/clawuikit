import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { join } from "path";

export interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface KanbanState {
  columns: Column[];
  cards: Card[];
  nextId: number;
}

const DATA_PATH = join(
  process.cwd(),
  "src",
  "demo",
  "mock-data",
  "kanban.json",
);
const SEED_PATH = join(
  process.cwd(),
  "src",
  "demo",
  "mock-data",
  "kanban.seed.json",
);

function read(): KanbanState {
  if (!existsSync(DATA_PATH)) {
    copyFileSync(SEED_PATH, DATA_PATH);
  }
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function write(state: KanbanState) {
  writeFileSync(DATA_PATH, JSON.stringify(state, null, 2) + "\n");
}

function genId(state: KanbanState, prefix: string): [string, KanbanState] {
  const id = `${prefix}-${state.nextId}`;
  return [id, { ...state, nextId: state.nextId + 1 }];
}

export function getState(): KanbanState {
  return read();
}

export function addCard(
  columnId: string,
  title: string,
  description = "",
): Card {
  let state = read();
  const [id, next] = genId(state, "card");
  state = next;

  const maxOrder = Math.max(
    -1,
    ...state.cards
      .filter((c) => c.columnId === columnId)
      .map((c) => c.order),
  );
  const card: Card = {
    id,
    title,
    description,
    columnId,
    order: maxOrder + 1,
  };
  state.cards.push(card);
  write(state);
  return card;
}

export function moveCard(
  cardId: string,
  toColumnId: string,
  toOrder?: number,
) {
  const state = read();
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);

  const order =
    toOrder ??
    Math.max(
      -1,
      ...state.cards
        .filter((c) => c.columnId === toColumnId)
        .map((c) => c.order),
    ) + 1;

  card.columnId = toColumnId;
  card.order = order;
  write(state);
}

export function updateCard(
  cardId: string,
  patch: Partial<Pick<Card, "title" | "description">>,
) {
  const state = read();
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);

  if (patch.title !== undefined) card.title = patch.title;
  if (patch.description !== undefined) card.description = patch.description;
  write(state);
}

export function deleteCard(cardId: string) {
  const state = read();
  state.cards = state.cards.filter((c) => c.id !== cardId);
  write(state);
}

export function addColumn(title: string): Column {
  let state = read();
  const [id, next] = genId(state, "col");
  state = next;

  const maxOrder = Math.max(-1, ...state.columns.map((c) => c.order));
  const column: Column = { id, title, order: maxOrder + 1 };
  state.columns.push(column);
  write(state);
  return column;
}

export function renameColumn(columnId: string, title: string) {
  const state = read();
  const column = state.columns.find((c) => c.id === columnId);
  if (!column) throw new Error(`Column ${columnId} not found`);
  column.title = title;
  write(state);
}

export function deleteColumn(columnId: string) {
  const state = read();
  state.columns = state.columns.filter((c) => c.id !== columnId);
  state.cards = state.cards.filter((c) => c.columnId !== columnId);
  write(state);
}
