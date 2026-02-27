import { NextResponse } from "next/server";
import * as store from "@/demo/lib/kanban-store";

export async function GET() {
  try {
    const state = store.getState();
    return NextResponse.json(state);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}

type Action =
  | {
      action: "addCard";
      columnId: string;
      title: string;
      description?: string;
    }
  | {
      action: "moveCard";
      cardId: string;
      toColumnId: string;
      toOrder?: number;
    }
  | {
      action: "updateCard";
      cardId: string;
      title?: string;
      description?: string;
    }
  | { action: "deleteCard"; cardId: string }
  | { action: "addColumn"; title: string }
  | { action: "renameColumn"; columnId: string; title: string }
  | { action: "deleteColumn"; columnId: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Action;

    switch (body.action) {
      case "addCard": {
        const card = store.addCard(
          body.columnId,
          body.title,
          body.description,
        );
        return NextResponse.json({ card });
      }
      case "moveCard": {
        store.moveCard(body.cardId, body.toColumnId, body.toOrder);
        return NextResponse.json({ ok: true });
      }
      case "updateCard": {
        const patch: Record<string, string> = {};
        if (body.title) patch.title = body.title;
        if (body.description) patch.description = body.description;
        store.updateCard(body.cardId, patch);
        return NextResponse.json({ ok: true });
      }
      case "deleteCard": {
        store.deleteCard(body.cardId);
        return NextResponse.json({ ok: true });
      }
      case "addColumn": {
        const column = store.addColumn(body.title);
        return NextResponse.json({ column });
      }
      case "renameColumn": {
        store.renameColumn(body.columnId, body.title);
        return NextResponse.json({ ok: true });
      }
      case "deleteColumn": {
        store.deleteColumn(body.columnId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
