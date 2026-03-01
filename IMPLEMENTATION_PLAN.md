# OpenClaw — Implementation Plan

> **References**: [ARCHITECTURE.md](./ARCHITECTURE.md)  
> **Status**: 🟡 In Progress  
> **Last Updated**: 2026-03-01  
> **Methodology**: Phased, vertical slices — each phase delivers working, testable software

---

## Overview

This document translates the [Architecture](./ARCHITECTURE.md) into a concrete, step-by-step build plan. Each phase is self-contained — the application remains functional after every phase completes. Phases are ordered by foundation first, features second.

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Cleanup    LLM       Voice     Indexer    Git        Agent     Polish
           Setup     (Whisper)            Engine     Lifecycle  + QA
```

---

## Phase 0: Stabilization & Cleanup ✅ (Current State)

> **Goal**: Ensure the existing application is stable and infinite loops are resolved before adding new complexity.

### 0.1 Infinite Loop Fix

- [x] Memoize `actions` object in `useKanban.ts` with `useMemo`
- [x] Refactor `useKanbanAutomations.ts` into separate, guarded `useEffect` hooks
- [x] Add `simulatingCardsRef` guard to prevent duplicate simulation timeouts
- [x] Verify no runaway API requests in server logs

### 0.2 Data Model Enhancement

- [x] Add `ExecutionStatus` type to `kanban-store.ts`
- [x] Add `executionStatus`, `executionLogs` to `Card` interface
- [x] Update `updateCard` store function to handle new fields
- [x] Update `/api/kanban` route to accept and persist execution metadata
- [x] Update `useKanban` hook types for new card fields

### 0.3 Card UI Foundation

- [x] Add ⚡ Execute button to `KanbanCard.tsx`
- [x] Add live log display panel to card
- [x] Add execution status badge
- [x] Add HITL correction input (shown on `error` status)

### 0.4 Architecture Documentation

- [x] Create `ARCHITECTURE.md` in project root
- [ ] Create `IMPLEMENTATION_PLAN.md` in project root (this file)

---

## Phase 1: Local LLM Integration (Ollama)

> **Ref**: [Architecture §4.2](./ARCHITECTURE.md#42-local-llm-integration-ollama) · [Architecture §9](./ARCHITECTURE.md#9-environment-variables)  
> **Goal**: Replace OpenAI cloud calls with a locally-running `deepseek-coder-v2` model via Ollama.  
> **Prerequisite**: Ollama must be installed and `deepseek-coder-v2:16b` pulled.

### 1.1 Environment & Dependencies

**Files to modify:**

- `.env` — add Ollama config
- `package.json` — add `ollama` npm package

```bash
# .env additions
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:16b
```

```bash
npm install ollama
```

### 1.2 LLM Proxy API Route

**File to create:** `src/app/api/llm/route.ts`

**Requirements:**

- Accept `POST` with body `{ prompt, system?, stream?, model?, context? }`
- Connect to `http://localhost:11434/api/generate` via the `ollama` npm client
- Support **Server-Sent Events (SSE)** streaming — pipe tokens back to the browser as they arrive
- Accept optional `context[]` array of file contents — prepend to prompt
- Handle Ollama offline gracefully: return `503` with clear error message
- Support non-streaming mode for internal agent use (returns full response)

**Expected behavior:**

```
POST /api/llm { prompt: "Write a hello world function in TypeScript" }
→ Streams tokens: "export", " function", " hello", ...
→ Final event: { done: true }
```

### 1.3 LLM Connectivity UI

**File to create:** `src/demo/components/atoms/LLMStatusIndicator.tsx`

**Requirements:**

- Small pill badge in the board header
- On mount, pings `GET /api/llm/health` (simple Ollama ping)
- States: 🟢 Ollama Connected | 🔴 Ollama Offline | 🟡 Checking
- Shows model name when connected (e.g., `deepseek-coder-v2:16b`)
- Tooltip on hover with Ollama version info

### 1.4 Environment Validation

**File to modify:** `src/app/api/llm/route.ts`

- On startup, validate `OLLAMA_BASE_URL` and `OLLAMA_MODEL` are set
- Log clear instructions if Ollama is not running
- Expose `GET /api/llm/health` that returns `{ ok: boolean, model: string, error?: string }`

### 1.5 Verification Steps

- [ ] Run `ollama pull deepseek-coder-v2:16b`
- [ ] Start dev server, check status indicator shows 🟢
- [ ] Test via browser console: `fetch('/api/llm', { method:'POST', body: JSON.stringify({ prompt:'Say hello' }) })`
- [ ] Verify streamed response appears token by token

---

## Phase 2: Local Voice Assistant (Whisper)

> **Ref**: [Architecture §4.3](./ARCHITECTURE.md#43-local-voice-assistant-whisper)  
> **Goal**: Replace Vapi (cloud) with a fully local press-to-talk system using browser MediaRecorder + local Whisper STT.

### 2.1 Dependencies

```bash
npm install nodejs-whisper
```

On first use, `nodejs-whisper` will auto-download the Whisper model (~244MB for `small`).

### 2.2 Voice Transcription API

**File to create:** `src/app/api/voice/route.ts`

**Requirements:**

- Accept `POST multipart/form-data` with `audio: File` (webm/ogg format from browser)
- Save audio to temp file (`/tmp/recording-{uuid}.webm`)
- Transcode to WAV if needed (Whisper requires 16kHz WAV)
- Pass WAV to `nodejs-whisper` for transcription
- Clean up temp files after processing
- Return: `{ transcript: string }`
- Handle empty audio, transcription failures with 400 errors

**Response:**

```json
{ "transcript": "Add a task to fix the login button bug" }
```

### 2.3 Intent Parsing

**File to modify:** `src/app/api/voice/route.ts`

After transcription, parse intent using the local LLM:

**LLM System Prompt for Intent Parsing:**

```
You are a Kanban board assistant. Parse the user's voice command into a structured action.

Available actions:
- addCard(columnId, title, description?)
- moveCard(cardId, toColumnId)
- deleteCard(cardId)
- executeTask(cardId)
- getStatus()
- abortAgent()

Current board state:
{boardState}

Respond ONLY with valid JSON matching the action schema. No explanation.
```

**Response includes intent:**

```json
{
  "transcript": "Add a task to fix the login button bug",
  "intent": {
    "action": "addCard",
    "params": {
      "columnId": "col-todo",
      "title": "[FIX] Fix the login button bug"
    },
    "confidence": 0.95
  }
}
```

### 2.4 LocalVoiceAssistant Component

**File to replace:** `src/core/components/VapiAssistant.tsx` → `LocalVoiceAssistant.tsx`

**Requirements:**

- Floating microphone button (bottom-right of screen)
- **Press and hold** to record, **release** to transcribe
- Visual states:
  - Idle: pulsing mic icon
  - Recording: red pulsing indicator + waveform animation + timer
  - Processing: spinning indicator
  - Result: transcript bubble with action summary
- After transcription, show a confirmation toast:
  ```
  🎤 Heard: "Add a task to fix the login bug"
  → Will: Add card "[FIX] Fix the login bug" to To Do
  [✅ Confirm] [❌ Cancel]
  ```
- Auto-confirm after 4 seconds if user doesn't cancel
- Handle errors gracefully: "Couldn't understand — please try again"

### 2.5 useVoiceBridge Hook (Rewrite)

**File to modify:** `src/demo/hooks/useVoiceBridge.ts`

**Requirements:**

- Replace all Vapi SDK code with browser `MediaRecorder` API
- Functions:
  - `startRecording()` — requests mic permission, starts recording
  - `stopRecording()` → `Promise<string>` — stops, sends to `/api/voice`, returns transcript
  - `executeIntent(intent)` — calls appropriate Kanban action
- Returns: `{ isRecording, transcript, intent, startRecording, stopRecording }`

### 2.6 Vapi Cleanup

- [ ] Remove `@vapi-ai/web` from `package.json`
- [ ] Remove `VAPI_API_KEY` and `NEXT_PUBLIC_VAPI_PUBLIC_KEY` from `.env`
- [ ] Remove `VapiAssistant.tsx` (replaced by `LocalVoiceAssistant.tsx`)
- [ ] Archive (do not delete) `useVoiceBridge.ts` before rewriting

### 2.7 Verification Steps

- [ ] Mic permission prompt appears on first use
- [ ] Hold button → red indicator shows
- [ ] Release → transcript appears in confirmation toast
- [ ] Say "Add a task to fix the navbar" → card appears on board
- [ ] Say "What's in progress?" → agent reads out cards

---

## Phase 3: Codebase Indexer

> **Ref**: [Architecture §4.4](./ARCHITECTURE.md#44-codebase-indexer)  
> **Goal**: Enable the agent to understand any linked project by indexing its source files.

### 3.1 Dependencies

```bash
npm install fast-glob ignore
```

### 3.2 Project Indexer API

**File to create:** `src/app/api/index/route.ts`

**Requirements:**

- Accept `POST { projectPath: string }`
- Validate that the path exists and is a directory
- Read `.gitignore` if present (use `ignore` package to respect it)
- Use `fast-glob` to enumerate all source files
  - Include: `*.ts, *.tsx, *.js, *.jsx, *.py, *.css, *.json, *.md`
  - Exclude: `node_modules/, .next/, dist/, .git/, __pycache__/`
- For each file:
  - Read content
  - Detect language by extension
  - Extract symbol names (regex-based: exports, function names, class names)
  - Extract import paths
- Store index in memory (`Map<string, ProjectIndex>` keyed by projectPath)
- Return: `{ fileCount, languages: {ts: 42, css: 3}, summary }`

**Performance:** Cap at 500 files. For larger projects, index only `src/` and config files.

### 3.3 Codebase Query API

**File to create:** `src/app/api/index/query/route.ts`

**Requirements:**

- Accept `POST { query: string, projectPath: string, maxFiles?: number }`
- **Scoring algorithm** for each indexed file:
  - +3 points if query terms appear in file path
  - +2 points if query terms appear in symbol names
  - +1 point if query terms appear in file content
- Return top N files sorted by relevance score
- Include: `filePath, language, content, symbols, relevanceScore`

**Future enhancement**: Replace keyword scoring with vector embeddings via `@xenova/transformers` (runs locally, no API needed).

### 3.4 Project Linker Component

**File to create:** `src/demo/components/organisms/ProjectLinker.tsx`

**Requirements:**

- Renders in `KanbanBoard.tsx` header area
- States:
  - **Unlinked**: "Link Project" button + text field for entering path
  - **Indexing**: Progress bar, "Indexing files..." with current file count
  - **Indexed**: ✅ badge with file count, language chips, "Re-index" button
- Persists linked path in `localStorage` key `openclaw_project_path`
- On mount, if `localStorage` has a path, auto-trigger re-index
- Allow unlinking (clears localStorage + memory index)

**Example UI when linked:**

```
📁 /home/user/my-app    [✅ 147 files indexed] [TS: 89 JS: 12 CSS: 46] [🔄 Re-index] [✕ Unlink]
```

### 3.5 useCodebaseIndex Hook

**File to create:** `src/demo/hooks/useCodebaseIndex.ts`

**Returns:**

```typescript
{
  projectPath: string | null;
  indexStatus: "idle" | "indexing" | "ready" | "error";
  fileCount: number;
  languages: Record<string, number>;
  linkProject: (path: string) => Promise<void>;
  unlinkProject: () => void;
  queryIndex: (query: string, maxFiles?: number) => Promise<IndexEntry[]>;
}
```

### 3.6 Verification Steps

- [ ] Enter project path → indexing progress shows
- [ ] Re-open browser → path is remembered, auto-re-indexes
- [ ] Test query: `queryIndex("authentication")` returns auth-related files

---

## Phase 4: Git Workflow Engine

> **Ref**: [Architecture §4.5](./ARCHITECTURE.md#45-git-workflow-engine)  
> **Goal**: Give the agent the ability to create branches, commit changes, and open PRs.

### 4.1 Dependencies

```bash
npm install simple-git @octokit/rest
```

### 4.2 Git Operations API

**File to create:** `src/app/api/git/route.ts`

**Operations to implement:**

| Action             | Git Command                              | Notes                         |
| ------------------ | ---------------------------------------- | ----------------------------- |
| `createBranch`     | `git checkout -b agent/task-{id}-{slug}` | Branching from current HEAD   |
| `stageAll`         | `git add -A`                             | Stage all changes             |
| `commit`           | `git commit -m "agent: {message}"`       | Conventional commit format    |
| `push`             | `git push origin {branch}`               | Requires remote + credentials |
| `getDiff`          | `git diff HEAD`                          | For showing changes           |
| `getStatus`        | `git status --porcelain`                 | Check staged/unstaged         |
| `getCurrentBranch` | `git branch --show-current`              | Know current state            |

**Security requirements:**

- All operations sandboxed to `projectPath` (passed in request)
- `projectPath` must be an existing directory containing `.git/`
- Never allow operations on `main` or `master` directly

**Branch naming:**

```typescript
function branchName(cardId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `agent/task-${cardId.slice(-6)}-${slug}`;
}
// Example: "agent/task-a3f2b1-fix-login-button-bug"
```

### 4.3 GitHub PR Creation

**Add to git route:**

```typescript
// Uses @octokit/rest
async function createPullRequest(params: {
  title: string;
  body: string;
  branch: string;
  base: string; // "main" or "master"
}): Promise<string>; // Returns PR URL
```

**PR body format** (see [Architecture §4.5](./ARCHITECTURE.md#45-git-workflow-engine) for full template).

### 4.4 Verification Steps

- [ ] `createBranch` creates branch in linked project
- [ ] After a manual file edit, `stageAll` + `commit` produces a git commit
- [ ] `getDiff` returns the correct diff
- [ ] If `GITHUB_TOKEN` set, `createPullRequest` opens a PR on GitHub

---

## Phase 5: AI Agent Lifecycle Engine

> **Ref**: [Architecture §4.6](./ARCHITECTURE.md#46-ai-agent-lifecycle)  
> **Goal**: The core of OpenClaw — a 6-stage FSM that autonomously executes tasks.

### 5.1 Agent Session Manager

**File to create:** `src/demo/lib/agent-engine.ts`

**Responsibilities:**

- Manages `AgentSession` objects (one per active card)
- Implements the FSM transitions: `ANALYZING → CLARIFYING → PLANNING → WORKING → TESTING → DONE`
- All state persisted to `kanban.json` via `updateCard`
- Exposes: `startSession`, `submitClarifications`, `approvePlan`, `abort`, `submitCorrection`

**FSM Transition Rules:**

```
ANALYZING:
  - If questions generated → CLARIFYING
  - If no questions → PLANNING

CLARIFYING:
  - Blocks until ALL questions have answers
  - On all answers received → PLANNING

PLANNING:
  - Blocks until admin approves
  - On approval → WORKING (create git branch)
  - On rejection → PLANNING (re-plan with rejection notes)

WORKING:
  - For each plan step: read file → LLM generate → write file → git commit
  - On all steps done → TESTING
  - On error → ERROR (pause, await correction)
  - On correction → resume WORKING

TESTING:
  - Write test files
  - Run `npm test`
  - If pass → push + create PR → DONE
  - If fail (max 3 retries) → auto-fix attempt
  - If still failing → ERROR
```

### 5.2 Streaming Agent API

**File to create:** `src/app/api/agent/route.ts`

**Requirements:**

- `POST /api/agent { cardId, projectPath }` → Server-Sent Events stream
- Opens SSE connection, hands off to `agent-engine.ts`
- Emits events as agent progresses (see [Architecture §6](./ARCHITECTURE.md#6-api-routes-reference) for event schema)
- Persists session state so client can reconnect if browser refreshes
- Keeps sessions in a `Map<cardId, AgentSession>` in memory

**SSE Event Format:**

```
data: {"type":"log","data":"🔍 Reading 12 relevant files..."}

data: {"type":"status","data":"analyzing"}

data: {"type":"question","data":[{"question":"Should this use REST or GraphQL?"}]}

data: {"type":"plan","data":"## Implementation Plan\n\n### Step 1: ..."}

data: {"type":"file_change","data":{"path":"src/auth.ts","linesAdded":42}}

data: {"type":"done","data":{"prUrl":"https://github.com/..."}}
```

### 5.3 Agent Control Routes

**Files to create:**

| File                                 | Method                                | Purpose                           |
| ------------------------------------ | ------------------------------------- | --------------------------------- |
| `src/app/api/agent/clarify/route.ts` | `POST { cardId, answers: string[] }`  | Submit answers to agent questions |
| `src/app/api/agent/approve/route.ts` | `POST { cardId }`                     | Approve agent's plan              |
| `src/app/api/agent/abort/route.ts`   | `POST { cardId }`                     | Kill agent session immediately    |
| `src/app/api/agent/correct/route.ts` | `POST { cardId, correction: string }` | Send real-time correction         |

### 5.4 Agent LLM Prompts

Each stage has a carefully engineered prompt. Store prompts in:

**File to create:** `src/demo/lib/agent-prompts.ts`

```typescript
export const prompts = {
  analyze: (task, files) => `...`,
  plan: (task, files, clarifications) => `...`,
  implement: (step, currentContent, context) => `...`,
  generateTests: (files, implementations) => `...`,
  summarizePR: (changes, testResults) => `...`,
};
```

See [Architecture §4.6](./ARCHITECTURE.md#46-ai-agent-lifecycle) for full prompt templates.

### 5.5 Enhanced KanbanCard UI

**File to modify:** `src/demo/components/molecules/KanbanCard.tsx`

Add new UI sections that render based on `card.executionStatus`:

| Status       | Additional UI                                        |
| ------------ | ---------------------------------------------------- |
| `analyzing`  | File-count progress: "Reading 8 of 15 files..."      |
| `clarifying` | `ClarificationForm` component                        |
| `planning`   | `PlanApproval` component with approve/reject buttons |
| `working`    | Live log stream + current file being written         |
| `testing`    | Test output log + pass/fail badge                    |
| `done`       | 🔗 "View PR" button + summary                        |
| `error`      | ❌ Error message + correction input (expanded)       |

### 5.6 New Sub-Components

**Files to create:**

#### `src/demo/components/molecules/ClarificationForm.tsx`

- Renders each question as a labeled textarea
- Validates all fields filled before enabling "Submit" button
- Calls `POST /api/agent/clarify` on submit

#### `src/demo/components/molecules/PlanApproval.tsx`

- Renders `card.agentPlan` as formatted markdown
- Syntax-highlighted code blocks (use `react-syntax-highlighter` or CSS)
- Shows file tree of planned changes
- "✅ Approve" → `POST /api/agent/approve`
- "❌ Reject" → opens rejection notes textarea → re-submits

#### `src/demo/components/molecules/AgentLogStream.tsx`

- Displays `card.executionLogs` array
- Auto-scrolls to bottom on new entries
- Monospace font, color-coded by log level (`🔍` blue, `✅` green, `❌` red)
- Collapsible (max height with scroll)

### 5.7 useAgentStream Hook

**File to create:** `src/demo/hooks/useAgentStream.ts`

**Returns:**

```typescript
{
  startExecution: (cardId: string, projectPath: string) => void;
  submitClarifications: (cardId: string, answers: string[]) => void;
  approvePlan: (cardId: string) => void;
  abort: (cardId: string) => void;
  submitCorrection: (cardId: string, correction: string) => void;
  // Active session state
  sessions: Map<string, { status, logs, questions, plan }>;
}
```

**SSE Connection management:**

- Opens `EventSource` to `/api/agent` on `startExecution`
- Reconnects automatically if connection drops
- Updates card state in `useKanban` on each SSE event
- Closes connection on `done` or `error` events

### 5.8 Verification Steps (Full Lifecycle Test)

- [ ] Add card "Add a loading spinner to all buttons"
- [ ] Click ⚡ Execute → status changes to `analyzing`
- [ ] Agent reads relevant UI component files
- [ ] (If questions) Answer questions → status moves to `planning`
- [ ] Approve plan → agent moves to `working`
- [ ] Watch live log as agent writes files
- [ ] Agent transitions to `testing` → runs tests
- [ ] Tests pass → card moves to "In Review", PR link appears
- [ ] End-to-end time: < 10 minutes

---

## Phase 6: Polish, Error Handling & QA

> **Goal**: Harden all features, improve UX, and ensure production quality.

### 6.1 Error States & Resilience

- [ ] Show clear error if Ollama is not running (with install instructions)
- [ ] Show clear error if project path is invalid
- [ ] Handle network interruptions in SSE stream (auto-reconnect with backoff)
- [ ] Handle `git` not found in PATH (with install instructions)
- [ ] Handle `GITHUB_TOKEN` not set (PR creation gracefully disabled)
- [ ] Handle test runner not found (`npm test` fails) — skip to DONE without tests

### 6.2 UI Polish

- [ ] Dark glassmorphism design consistent across all new components
- [ ] Loading skeletons while agent is initializing
- [ ] Smooth transitions between card status states
- [ ] Toast notifications for key events (plan approved, PR created, etc.)
- [ ] Keyboard shortcuts: `Space` = push-to-talk, `Escape` = abort agent

### 6.3 Performance

- [ ] Index query returns in < 100ms (optimize scoring algorithm)
- [ ] SSE stream shows first token within 3 seconds
- [ ] Board remains responsive during agent execution (no UI freeze)
- [ ] Limit card log display to last 50 entries (with "Show all" toggle)

### 6.4 Security Audit

- [ ] Verify all file operations are within project root (path traversal test)
- [ ] Ensure agent cannot run arbitrary shell commands
- [ ] Validate `projectPath` exists and is a directory before indexing
- [ ] Sanitize task titles/descriptions before injecting into git commands

### 6.5 Documentation

- [ ] Update `README.md` with setup instructions
- [ ] Update `ARCHITECTURE.md` with any implementation learnings
- [ ] Create `CHANGELOG.md` documenting each phase's additions
- [ ] Add JSDoc comments to all new hooks and API routes

---

## Development Sequence Summary

| Phase                | Est. Duration | Deliverable                               |
| -------------------- | ------------- | ----------------------------------------- |
| ~~0: Stabilization~~ | ~~Done~~      | ~~Stable board, no infinite loops~~       |
| 1: Local LLM         | 1–2 hours     | Ollama integration, streaming LLM API     |
| 2: Local Voice       | 2–3 hours     | Whisper STT, new voice component          |
| 3: Codebase Indexer  | 2–3 hours     | Project linking, file indexing, query API |
| 4: Git Workflow      | 1–2 hours     | Branch/commit/PR creation                 |
| 5: Agent Lifecycle   | 4–6 hours     | Full autonomous execution FSM             |
| 6: Polish & QA       | 2–3 hours     | Hardened, production-quality system       |

**Total Estimated Build Time**: 12–19 hours of focused development

---

## Definition of Done

The implementation is complete when:

1. ✅ Developer can link any local project folder → agent indexes it
2. ✅ Developer adds a task to "To Do" and clicks Execute
3. ✅ Agent reads the codebase, asks questions if needed
4. ✅ Agent generates and presents an implementation plan for approval
5. ✅ Agent writes real code to the project folder on a git branch
6. ✅ Agent writes and runs tests, attempts auto-fix on failure
7. ✅ Agent creates a GitHub PR with a full description
8. ✅ Card advances to "In Review" with a PR link
9. ✅ Developer can review, request changes, or merge the PR on GitHub
10. ✅ All of the above can be triggered by voice command

---

_End of Implementation Plan_
