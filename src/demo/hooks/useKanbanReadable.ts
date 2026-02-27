"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import type { KanbanState } from "./useKanban";

export function useKanbanReadable(state: KanbanState) {
  useCopilotReadable({
    description:
      "Current kanban board state. Contains columns (lists) and cards. Each card has an id, title, description, columnId, and order. Each column has an id, title, and order.",
    value: state,
  });
}
