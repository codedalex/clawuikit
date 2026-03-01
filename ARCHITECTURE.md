# OpenClaw — Architecture Document

> **Version**: 2.0.0  
> **Last Updated**: 2026-03-01  
> **Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Ollama · Whisper · Git

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [High-Level Architecture](#2-high-level-architecture)
3. [System Components](#3-system-components)
4. [Feature Specifications](#4-feature-specifications)
   - [4.1 Kanban Board (Core)](#41-kanban-board-core)
   - [4.2 Local LLM Integration (Ollama)](#42-local-llm-integration-ollama)
   - [4.3 Local Voice Assistant (Whisper)](#43-local-voice-assistant-whisper)
   - [4.4 Codebase Indexer](#44-codebase-indexer)
   - [4.5 Git Workflow Engine](#45-git-workflow-engine)
   - [4.6 AI Agent Lifecycle](#46-ai-agent-lifecycle)
   - [4.7 Human-in-the-Loop (HITL)](#47-human-in-the-loop-hitl)
5. [Data Models](#5-data-models)
6. [API Routes Reference](#6-api-routes-reference)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Directory Structure](#8-directory-structure)
9. [Environment Variables](#9-environment-variables)
10. [Dependencies](#10-dependencies)
11. [Development Setup](#11-development-setup)
12. [Security Model](#12-security-model)

---

## 1. Project Vision

**OpenClaw** is a **locally-running AI software engineer** embedded into a developer's workflow. It is not a cloud service — every component, from the language model to the voice transcriber, runs entirely on the developer's machine, ensuring privacy and zero API costs.

### Core Pillars

| Pillar                  | Description                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **Local-First**         | All AI inference runs locally via Ollama. No data leaves the machine.                          |
| **Code-Specialist**     | Uses `deepseek-coder-v2:16b`, the best open-source model for software engineering tasks.       |
| **Autonomous Executor** | The agent reads real code, creates real git branches, and writes real files. Not a simulation. |
| **Human-in-the-Loop**   | Every significant decision (plan approval, PR merge) requires explicit admin confirmation.     |
| **Voice-Driven**        | Browser `MediaRecorder API` + local `Whisper` STT enables hands-free control.                  |

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (UI)                                │
│                                                                          │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐   │
│   │  Kanban Board   │   │  Task Detail    │   │  Voice Assistant    │   │
│   │  (Drag & Drop)  │   │  + Live Logs    │   │  (press-to-talk)    │   │
│   │                 │   │  + HITL Forms   │   │                     │   │
│   └────────┬────────┘   └────────┬────────┘   └──────────┬──────────┘   │
│            └──────────────┬──────┘                        │              │
│                           │    HTTP / SSE                 │              │
└───────────────────────────┼───────────────────────────────┼──────────────┘
                            │                               │
┌───────────────────────────┼───────────────────────────────┼──────────────┐
│                    NEXT.JS API ROUTES (Node.js)           │              │
│                                                           │              │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  /api/kanban   │  │  /api/agent     │  │  /api/voice             │  │
│  │  CRUD + State  │  │  SSE Stream     │  │  Audio → Whisper → Text │  │
│  └────────────────┘  └────────┬────────┘  └─────────────────────────┘  │
│  ┌────────────────┐           │           ┌─────────────────────────┐  │
│  │  /api/index    │      ┌────┴────┐      │  /api/git               │  │
│  │  Glob + Read   │      │ Agent   │      │  branch / commit / PR   │  │
│  │  Codebase      │      │ Engine  │      └─────────────────────────┘  │
│  └────────────────┘      │ (FSM)   │                                   │
│  ┌────────────────┐      └────┬────┘                                   │
│  │  /api/llm      │           │                                         │
│  │  Ollama Proxy  │◄──────────┘                                         │
│  └────────────────┘                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────┐
│                    LOCAL SERVICES                                        │
│                                                                          │
│  ┌────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  Ollama            │  │  Whisper         │  │  File System         │ │
│  │  deepseek-coder    │  │  (nodejs-whisper)│  │  (Project Folder)    │ │
│  │  :16b              │  │  STT             │  │  Read ← Agent → Write│ │
│  │  port 11434        │  └──────────────────┘  └──────────────────────┘ │
│  └────────────────────┘                        ┌──────────────────────┐ │
│                                                │  Git CLI             │ │
│                                                │  (child_process)     │ │
│                                                └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. System Components

### 3.1 Frontend (Browser)

| Component             | Location                                              | Responsibility                         |
| --------------------- | ----------------------------------------------------- | -------------------------------------- |
| `KanbanBoard`         | `src/demo/components/organisms/KanbanBoard.tsx`       | Full-screen drag-and-drop board        |
| `KanbanColumn`        | `src/demo/components/organisms/KanbanColumn.tsx`      | Each column (To Do, In Progress, etc.) |
| `KanbanCard`          | `src/demo/components/molecules/KanbanCard.tsx`        | Task card with AI execution UI         |
| `TaskDetailPanel`     | `src/demo/components/organisms/TaskDetailPanel.tsx`   | Slide-over panel for full task view    |
| `ProjectLinker`       | `src/demo/components/organisms/ProjectLinker.tsx`     | Link a project folder to the agent     |
| `LocalVoiceAssistant` | `src/core/components/LocalVoiceAssistant.tsx`         | Press-to-talk voice interface          |
| `AgentLogStream`      | `src/demo/components/molecules/AgentLogStream.tsx`    | Live SSE log viewer                    |
| `PlanApproval`        | `src/demo/components/molecules/PlanApproval.tsx`      | Approval UI for agent plans            |
| `ClarificationForm`   | `src/demo/components/molecules/ClarificationForm.tsx` | HITL Q&A interface                     |

### 3.2 Backend (API Routes)

| Route                | Method     | Description                         |
| -------------------- | ---------- | ----------------------------------- |
| `/api/kanban`        | GET, POST  | Read and mutate Kanban board state  |
| `/api/agent`         | POST (SSE) | Start agent execution, stream logs  |
| `/api/agent/clarify` | POST       | Submit answer to agent's question   |
| `/api/agent/approve` | POST       | Approve agent's implementation plan |
| `/api/agent/abort`   | POST       | Stop agent execution                |
| `/api/index`         | POST       | Index a project folder              |
| `/api/index/query`   | POST       | Query the codebase index            |
| `/api/git`           | POST       | Execute git operations              |
| `/api/llm`           | POST       | Proxy to local Ollama (streaming)   |
| `/api/voice`         | POST       | Transcribe audio via local Whisper  |

### 3.3 Custom Hooks

| Hook                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `useKanban`            | Core Kanban state, actions, and polling           |
| `useKanbanTools`       | Registers Kanban actions as CopilotKit tools      |
| `useKanbanAutomations` | Auto-triage, smart breakdown, sync triggers       |
| `useAgentStream`       | Subscribes to agent SSE stream, manages log state |
| `useVoiceBridge`       | Manages local recording and Whisper transcription |
| `useCodebaseIndex`     | Manages linked project folder and indexed state   |

---

## 4. Feature Specifications

---

### 4.1 Kanban Board (Core)

#### Overview

The board is the primary UI. It displays tasks as cards across multiple columns, supports drag-and-drop reordering, and exposes AI execution controls on each card.

#### Columns (Default)

1. **To Do** — New tasks. AI execution can be triggered here.
2. **In Progress** — Tasks actively being worked on (by human or AI agent).
3. **In Review** — Tasks where AI has completed work and a PR is open.
4. **Done** — Fully reviewed and merged tasks.

#### Card States

Cards have an `executionStatus` that drives their UI:

| Status       | Icon | Meaning                                     |
| ------------ | ---- | ------------------------------------------- |
| `idle`       | —    | Not yet assigned to AI                      |
| `analyzing`  | 🔍   | Agent is reading the codebase               |
| `clarifying` | ❓   | Agent has questions for the admin           |
| `planning`   | 📋   | Agent has created a plan, awaiting approval |
| `working`    | ⚙️   | Agent is writing code                       |
| `testing`    | 🧪   | Agent is running unit tests                 |
| `error`      | ❌   | Agent hit a blocker, needs input            |
| `done`       | ✅   | Agent finished, PR is open                  |

#### Backend Logic

- State persisted in `src/demo/mock-data/kanban.json`
- Read/written via `src/demo/lib/kanban-store.ts`
- API route: `src/app/api/kanban/route.ts`
- Frontend polls every 3 seconds via `useKanban` hook

#### UI Requirements

- Full-screen, horizontal scroll layout
- Glassmorphism column styling
- Cards show tags (auto-triaged), execution status badge, live log tail
- Hover reveals: ⚡ Execute, ✏️ Edit, 🗑️ Delete buttons
- Drag-and-drop via `@dnd-kit`

---

### 4.2 Local LLM Integration (Ollama)

#### Overview

All AI inference runs through **Ollama**, which must be installed and running on the developer's machine. The system uses `deepseek-coder-v2:16b` as its primary model.

#### Why `deepseek-coder-v2:16b`?

- Best-in-class open-source model for code tasks
- Trained specifically on code, not general knowledge
- Understands multi-file project structures
- Supports 128k context window (can fit large codebases)
- Runs on a single consumer GPU (16GB VRAM) or CPU

#### Backend: `/api/llm`

**Request:**

```typescript
{
  prompt: string;               // The full prompt
  system?: string;              // System instructions
  stream?: boolean;             // Enable SSE streaming (default: true)
  model?: string;               // Override model, default: deepseek-coder-v2:16b
  context?: string[];           // Relevant file contents to inject
}
```

**Response:**

- Server-Sent Events (SSE) stream of tokens
- Each event: `data: { token: string, done: boolean }`

**Implementation:**

```typescript
// src/app/api/llm/route.ts
const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
  method: "POST",
  body: JSON.stringify({
    model: process.env.OLLAMA_MODEL,
    prompt: fullPrompt,
    stream: true,
  }),
});
// Pipe Ollama stream → Response SSE stream
```

#### Frontend: `useAgentStream`

- Opens `EventSource` to `/api/agent` (which internally calls `/api/llm`)
- Appends streamed tokens to card `executionLogs`
- Handles `error` and `done` events to update card status

---

### 4.3 Local Voice Assistant (Whisper)

#### Overview

Replaces Vapi with a fully local, zero-cost voice pipeline:

1. **Capture** — Browser `MediaRecorder` API records audio
2. **Transcribe** — `nodejs-whisper` (Whisper base/small model) converts speech to text
3. **Understand** — Local LLM interprets the command and determines action
4. **Execute** — Kanban action is performed

#### Voice Command Examples

| User Says                                 | Agent Does                                    |
| ----------------------------------------- | --------------------------------------------- |
| "Add a task to fix the login bug"         | `addCard("To Do", "[FIX] Fix the login bug")` |
| "Move authentication card to in progress" | `moveCard(authCardId, "In Progress")`         |
| "Execute the task build user profile"     | Triggers full agent lifecycle on that card    |
| "What's currently in progress?"           | Reads out all In Progress cards               |
| "Abort the current agent task"            | Calls `/api/agent/abort`                      |

#### Backend: `/api/voice`

**Request:**

```
POST /api/voice
Content-Type: multipart/form-data
Body: { audio: File (webm/ogg) }
```

**Response:**

```typescript
{
  transcript: string; // Whisper output
  intent: {
    // LLM-parsed intent
    action: string; // "addCard" | "moveCard" | "executeTask" | ...
    params: object; // Action parameters
  }
}
```

#### Frontend: `LocalVoiceAssistant.tsx`

- Press-and-hold microphone button → records via `MediaRecorder`
- On release → sends blob to `/api/voice`
- Shows transcript and inferred action for confirmation
- Auto-executes when confidence is high, prompts when ambiguous

#### Whisper Model Selection

| Model    | Size  | Speed  | Accuracy                 |
| -------- | ----- | ------ | ------------------------ |
| `base`   | 74MB  | Fast   | Good for simple commands |
| `small`  | 244MB | Medium | Recommended for dev use  |
| `medium` | 769MB | Slow   | Best accuracy, needs GPU |

---

### 4.4 Codebase Indexer

#### Overview

Before the AI can work on tasks, it needs to understand the project. The indexer crawls the linked folder, reads all source files, and creates a structured index the agent can query.

#### Indexing Flow

```
User links folder path (/home/user/my-project)
         ↓
POST /api/index { projectPath: string }
         ↓
fast-glob reads all files (respects .gitignore)
         ↓
For each file:
  - Read content
  - Detect language
  - Extract: exports, imports, class names, function names
  - Chunk into 500-token segments
         ↓
Store in memory: IndexEntry[]
         ↓
Return: { fileCount, languages, summary }
```

#### Index Entry Schema

```typescript
interface IndexEntry {
  filePath: string; // Relative path from project root
  language: string; // "typescript" | "python" | etc.
  content: string; // Full file content
  symbols: string[]; // Exported names, class names, etc.
  imports: string[]; // What this file depends on
  lastModified: Date;
}
```

#### Querying the Index: `/api/index/query`

When the agent needs context for a task, it queries the index with a natural language description:

**Request:**

```typescript
{
  query: string;           // e.g. "authentication and user session management"
  maxFiles?: number;       // Max files to return (default: 10)
}
```

**Implementation**: Simple keyword matching on file paths, exports, and content. Future: vector embeddings via `@xenova/transformers` running locally.

#### Frontend: `ProjectLinker.tsx`

- Directory path input (text field, since browser can't directly access FS)
- "Index Project" button
- Progress indicator while indexing
- After indexing:
  - Total files count
  - Language breakdown chart
  - "Re-index" button
  - Linked path persisted in `localStorage`

---

### 4.5 Git Workflow Engine

#### Overview

The agent operates on a **dedicated git branch** to ensure all changes are isolated and the main codebase is never polluted. The workflow mirrors a real human developer's git hygiene.

#### Git Operations

| Operation           | Command                                  | When                           |
| ------------------- | ---------------------------------------- | ------------------------------ |
| Create agent branch | `git checkout -b agent/task-{id}-{slug}` | On execution start             |
| Stage changes       | `git add -A`                             | After each file write          |
| Commit              | `git commit -m "agent: <description>"`   | After each implementation step |
| Push                | `git push origin <branch>`               | After all changes are done     |
| Create PR           | GitHub API call                          | When task moves to "In Review" |

#### Backend: `/api/git`

**Request types:**

```typescript
type GitAction =
  | { action: "createBranch"; taskId: string; taskTitle: string }
  | { action: "commit"; message: string; files?: string[] }
  | { action: "push"; branch: string }
  | {
      action: "createPR";
      title: string;
      body: string;
      branch: string;
      base: string;
    }
  | { action: "getCurrentBranch" }
  | { action: "getDiff"; branch: string }
  | { action: "getStatus" };
```

**Branch Naming Convention:**

```
agent/task-{cardId}-{kebab-case-title}
Example: agent/task-a3f2-fix-login-bug
```

**PR Body Template:**

```markdown
## 🤖 AI Agent Pull Request

**Task**: {cardTitle}
**Branch**: {branchName}
**Agent Model**: deepseek-coder-v2:16b

### Implementation Summary

{agentSummary}

### Files Changed

{changedFiles}

### Test Results

{testOutput}

### Notes for Reviewer

{agentNotes}

---

_This PR was created autonomously by OpenClaw Agent. Review all changes carefully._
```

#### GitHub Integration

- Requires `GITHUB_TOKEN` in `.env`
- Uses GitHub REST API via `@octokit/rest`
- Only creates PRs, never merges (always human-gated)

---

### 4.6 AI Agent Lifecycle

#### Overview

This is the heart of OpenClaw. When a developer clicks "Execute" on a task card, the agent enters a **6-stage finite state machine** (FSM):

```
IDLE → ANALYZING → CLARIFYING ←→ (admin answers) → PLANNING
→ (admin approves) → WORKING → TESTING → REVIEW_READY
```

#### Stage Details

---

##### Stage 1: ANALYZING 🔍

**Trigger**: User clicks ⚡ Execute on a card  
**Duration**: 30 seconds to 5 minutes  
**What happens**:

1. Agent reads the task title and description
2. Calls `/api/index/query` to find the most relevant files in the codebase
3. Reads the top 10-15 relevant files in full
4. Builds a comprehensive understanding of:
   - What the task is asking
   - Which parts of the codebase are affected
   - What dependencies, interfaces, and patterns are in use
   - What testing infrastructure exists

**Agent Prompt Template:**

```
You are a senior software engineer. You have been assigned the following task:

TASK: {taskTitle}
DESCRIPTION: {taskDescription}

CODEBASE CONTEXT:
{relevantFiles}

Your job is to:
1. Identify EVERY file that needs to be changed or created
2. Identify any ambiguities or missing information
3. List the questions you need answered before starting

Output format:
AFFECTED_FILES: [list of files]
QUESTIONS: [list of questions, or "NONE" if fully understood]
```

**Card UI Updates**: Status → `analyzing`, logs show files being read

---

##### Stage 2: CLARIFYING ❓

**Trigger**: ANALYZING stage produced questions  
**Skipped if**: Agent fully understands the task  
**What happens**:

1. Agent generates a numbered list of questions
2. Questions are stored in `card.clarifications[]`
3. Card UI shows a `ClarificationForm` with each question as an input field
4. Admin types answers and submits
5. Agent receives answers and proceeds to PLANNING

**Frontend**: `ClarificationForm.tsx`

- Shows agent avatar with question count badge
- Each question has a labeled text area
- "Submit Answers" button calls `POST /api/agent/clarify`
- Card stays in `clarifying` status until all questions answered

---

##### Stage 3: PLANNING 📋

**Trigger**: ANALYZING complete (no questions, or all questions answered)  
**Duration**: 1-3 minutes  
**What happens**:

1. Agent generates a **very detailed implementation plan**
2. Plan includes:
   - Step-by-step breakdown of every change
   - Which files will be created/modified/deleted
   - Code snippets showing the planned approach
   - Estimated complexity and risks
3. Plan stored in `card.agentPlan`
4. Card transitions to `planning` status
5. Admin sees plan and must approve before agent proceeds

**Agent Prompt Template:**

```
Based on the task and your analysis, create a detailed implementation plan.

TASK: {taskTitle}
AFFECTED FILES: {affectedFiles}
ADMIN ANSWERS: {clarifications}

Your plan must include:
1. STEP-BY-STEP IMPLEMENTATION (each file change, in order)
2. NEW FILES to create (with content outline)
3. EXISTING FILES to modify (with specific changes)
4. DEPENDENCIES to add (if any)
5. TEST PLAN (what unit tests to write)
6. RISKS & CONSIDERATIONS
```

**Frontend**: `PlanApproval.tsx`

- Renders the plan as formatted markdown
- Syntax-highlighted code snippets
- File-tree showing changed/new/deleted files
- "✅ Approve Plan" and "❌ Reject & Re-plan" buttons
- If rejected, admin can add notes → agent generates revised plan

---

##### Stage 4: WORKING ⚙️

**Trigger**: Admin approves the plan  
**Duration**: Variable (depends on task complexity)  
**What happens**:

1. Agent creates a dedicated git branch
2. For each step in the approved plan:
   a. Agent reads current file content
   b. Generates new file content using LLM
   c. Writes file to disk via Node.js `fs.writeFile`
   d. Stages and commits the change to git
   e. Streams the change summary to the UI
3. Card UI shows live log with each file being written

**File Writing API (internal)**:

```typescript
// Agent internal method
async function writeFile(filePath: string, content: string) {
  const absolutePath = path.join(projectRoot, filePath);
  // Security check: must be within projectRoot
  if (!absolutePath.startsWith(projectRoot)) {
    throw new Error("SECURITY: Attempted path traversal");
  }
  await fs.writeFile(absolutePath, content, "utf-8");
  await gitStageFile(absolutePath);
}
```

**Agent LLM Prompt per file:**

```
You are writing code for a production application.

TASK: {taskTitle}
PLAN STEP: {currentStep}
CURRENT FILE CONTENT: {currentFileContent}
RELEVANT CONTEXT: {contextFiles}

Write the COMPLETE, updated file content. No explanations,
no markdown fences — ONLY the raw file content.
```

---

##### Stage 5: TESTING 🧪

**Trigger**: All planned file changes are complete  
**Duration**: 1-5 minutes  
**What happens**:

1. Agent reads the modified files and understands what was implemented
2. Generates unit tests covering:
   - Happy path for each new function
   - Edge cases
   - Error handling
3. Writes test files to disk (e.g., `__tests__/feature.test.ts`)
4. Executes tests via `child_process.exec('npm test -- --watchAll=false')`
5. Streams test output to the UI log
6. If tests pass → advance to REVIEW
7. If tests fail → agent analyzes failure, attempts auto-fix (max 3 retries)

**Test Retry Logic:**

```
Run tests
  ↓ Fail
Agent reads error output
  ↓
Generates fix for failing tests
  ↓
Applies fix to files
  ↓
Re-runs tests
  ↓ (repeat max 3 times)
  ↓ If still failing after 3 retries
Status → ERROR, human review required
```

---

##### Stage 6: IN REVIEW / PR READY ✅

**Trigger**: All tests pass  
**What happens**:

1. Agent commits final changes with audit message
2. Pushes branch to GitHub: `git push origin agent/task-{id}`
3. Creates GitHub Pull Request via Octokit
4. PR URL stored in `card.prUrl`
5. Card moves to **"In Review"** column automatically
6. UI shows: PR link, diff summary, test results

**Card Shows:**

- 🔗 "View PR on GitHub" link
- 📊 Files changed count and line diff stats
- ✅ Test results summary
- 🕐 Timeline of agent actions

**Admin Actions on Review:**

- Click "View PR" → goes to GitHub to review diff
- On GitHub: approve and merge, or request changes
- If changes requested: add comment → agent re-enters WORKING stage

---

### 4.7 Human-in-the-Loop (HITL)

#### Philosophy

The agent is powerful but not infallible. Every stage where the agent might make a wrong assumption has a mandatory human checkpoint. The admin is never "locked out" of the process.

#### Checkpoints

| Stage      | Human Action Required  | Can Skip?               |
| ---------- | ---------------------- | ----------------------- |
| ANALYZING  | None                   | —                       |
| CLARIFYING | Answer all questions   | No — agent blocks       |
| PLANNING   | Approve or reject plan | No — agent blocks       |
| WORKING    | Optional corrections   | Can correct at any time |
| TESTING    | None (auto)            | —                       |
| IN REVIEW  | Review and merge PR    | No — agent never merges |

#### Admin Correction During WORKING Stage

At any point during the WORKING stage, the admin can:

1. Click "Pause Agent" on the card
2. Type a correction in the correction input
3. Click "Resume" — agent incorporates the feedback

The correction is injected into the agent's next LLM prompt as:

```
ADMIN CORRECTION: {correctionText}
Revise your approach based on this feedback before continuing.
```

#### Error Recovery

If the agent sets status to `error`:

- Card displays the error message prominently
- Correction input is expanded and focused
- Admin types resolution guidance
- Agent resumes from the last successful checkpoint

---

## 5. Data Models

### Card (Enhanced)

```typescript
export type ExecutionStatus =
  | "idle"
  | "analyzing"
  | "clarifying"
  | "planning"
  | "working"
  | "testing"
  | "error"
  | "done";

export interface Clarification {
  question: string;
  answer?: string; // Undefined until admin answers
}

export interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  order: number;

  // AI Execution
  executionStatus?: ExecutionStatus;
  executionLogs?: string[]; // Flat array of timestamped log lines
  agentPlan?: string; // Markdown plan text (awaiting approval)
  clarifications?: Clarification[]; // Q&A thread with admin
  affectedFiles?: string[]; // Files agent plans to touch
  branch?: string; // Git branch name
  prUrl?: string; // GitHub PR URL
  testResults?: string; // Test output summary
}
```

### Column

```typescript
export interface Column {
  id: string;
  title: string;
  order: number;
}
```

### Kanban State

```typescript
export interface KanbanState {
  columns: Column[];
  cards: Card[];
  nextId: number;
}
```

### Project Index

```typescript
export interface IndexEntry {
  filePath: string; // Relative to project root
  language: string;
  content: string; // Full file content
  symbols: string[]; // Exported/defined names
  imports: string[]; // Dependencies
  size: number; // Bytes
  lastModified: string; // ISO timestamp
}

export interface ProjectIndex {
  projectPath: string; // Absolute path to project root
  indexedAt: string; // ISO timestamp
  files: IndexEntry[];
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>; // { typescript: 42, css: 3 }
  };
}
```

### Agent Session

```typescript
export interface AgentSession {
  cardId: string;
  taskTitle: string;
  taskDescription: string;
  branch: string;
  stage: ExecutionStatus;
  startedAt: string;
  projectPath: string;
  indexSnapshot: IndexEntry[]; // Relevant files at session start
  clarifications: Clarification[];
  plan: string;
  completedSteps: string[];
  pendingSteps: string[];
  filesWritten: string[];
  aborted: boolean;
}
```

---

## 6. API Routes Reference

### `GET /api/kanban`

Returns full board state.  
**Response**: `{ columns: Column[], cards: Card[] }`

### `POST /api/kanban`

Mutates board state.  
**Body**: Action object (addCard, moveCard, updateCard, deleteCard, addColumn, etc.)

### `POST /api/agent`

Starts agent execution on a task. Returns SSE stream.  
**Body**: `{ cardId: string, projectPath: string }`  
**Stream Events**:

```typescript
{ type: "log", data: string }              // Progress message
{ type: "status", data: ExecutionStatus }  // Status change
{ type: "question", data: Clarification[] }// Blocking question
{ type: "plan", data: string }             // Plan ready for approval
{ type: "file_change", data: { path, content } } // File written
{ type: "test_result", data: string }      // Test output
{ type: "done", data: { prUrl: string } }  // Complete
{ type: "error", data: string }            // Error occurred
```

### `POST /api/agent/clarify`

Submit answers to agent questions.  
**Body**: `{ cardId: string, answers: string[] }`

### `POST /api/agent/approve`

Approve the agent's plan.  
**Body**: `{ cardId: string }`

### `POST /api/agent/abort`

Stop agent immediately.  
**Body**: `{ cardId: string }`

### `POST /api/agent/correct`

Submit a real-time correction.  
**Body**: `{ cardId: string, correction: string }`

### `POST /api/index`

Index a project folder.  
**Body**: `{ projectPath: string }`  
**Response**: `{ fileCount, languages, summary }`

### `POST /api/index/query`

Find relevant files for a task.  
**Body**: `{ query: string, maxFiles?: number }`  
**Response**: `{ files: IndexEntry[] }`

### `POST /api/git`

Execute a git operation.  
**Body**: `GitAction` union type

### `POST /api/llm`

Proxy to Ollama with streaming.  
**Body**: `{ prompt, system?, model?, context? }`  
**Response**: SSE stream of tokens

### `POST /api/voice`

Transcribe audio and extract intent.  
**Body**: Multipart form with `audio: File`  
**Response**: `{ transcript, intent: { action, params } }`

---

## 7. Frontend Architecture

### Component Hierarchy

```
layout.tsx (ClawUIProvider, CopilotKit context)
└── page.tsx (SplitLayout)
    ├── ChatSidebar (CopilotChat)
    └── KanbanDemo
        ├── ProjectLinker (header bar)
        │   └── IndexStatus
        ├── LocalVoiceAssistant (floating button)
        └── KanbanBoard
            └── KanbanColumn (×4)
                └── KanbanCard (×n)
                    ├── CardHeader (title, tags, delete)
                    ├── ExecutionStatusBadge
                    ├── AgentLogStream (live logs)
                    ├── ClarificationForm (when clarifying)
                    ├── PlanApproval (when planning)
                    └── CardFooter (id, PR link, verified badge)
```

### State Management

```
useKanban (central state)
    ↓ state, actions
useKanbanTools (CopilotKit registration)
useKanbanAutomations (auto-triage, smart breakdown)
useAgentStream (per-card SSE subscription)
useCodebaseIndex (project folder + index state)
useVoiceBridge (recording + whisper + intent)
```

### Data Flow for AI Execution

```
User clicks ⚡ Execute on KanbanCard
    ↓
KanbanCard calls onExecute(cardId)
    ↓
KanbanDemo calls useAgentStream.startExecution(cardId)
    ↓
useAgentStream opens EventSource to POST /api/agent
    ↓
Backend agent reads task, indexes codebase, starts FSM
    ↓
SSE events stream back → useAgentStream updates log state
    ↓
KanbanCard re-renders with new logs, status, forms
    ↓
Admin interacts (answers, approves) → POST /api/agent/clarify, /approve
    ↓
Agent continues, writes files, runs tests, creates PR
    ↓
Final event: { type: "done", data: { prUrl } }
    ↓
Card moves to "In Review" column with PR link
```

---

## 8. Directory Structure

```
c:/projects/aitinkerers/
├── ARCHITECTURE.md               ← This file
├── .env                          ← Local secrets
├── .env.example                  ← Env template
├── package.json
├── next.config.mjs
├── tailwind.config.ts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            ← Root layout, providers
│   │   ├── page.tsx              ← Entry point
│   │   ├── globals.css           ← Design system styles
│   │   └── api/
│   │       ├── kanban/route.ts   ← Board CRUD
│   │       ├── agent/
│   │       │   ├── route.ts      ← Start execution (SSE)
│   │       │   ├── clarify/route.ts
│   │       │   ├── approve/route.ts
│   │       │   ├── abort/route.ts
│   │       │   └── correct/route.ts
│   │       ├── index/
│   │       │   ├── route.ts      ← Index project folder
│   │       │   └── query/route.ts
│   │       ├── git/route.ts      ← Git operations
│   │       ├── llm/route.ts      ← Ollama proxy
│   │       ├── voice/route.ts    ← Whisper transcription
│   │       └── copilotkit/route.ts
│   │
│   ├── core/
│   │   └── components/
│   │       └── LocalVoiceAssistant.tsx
│   │
│   └── demo/
│       ├── KanbanDemo.tsx        ← Main demo wrapper
│       │
│       ├── components/
│       │   ├── organisms/
│       │   │   ├── KanbanBoard.tsx
│       │   │   ├── KanbanColumn.tsx
│       │   │   └── ProjectLinker.tsx
│       │   └── molecules/
│       │       ├── KanbanCard.tsx
│       │       ├── AgentLogStream.tsx
│       │       ├── PlanApproval.tsx
│       │       └── ClarificationForm.tsx
│       │
│       ├── hooks/
│       │   ├── useKanban.ts
│       │   ├── useKanbanTools.ts
│       │   ├── useKanbanAutomations.ts
│       │   ├── useAgentStream.ts        ← NEW
│       │   ├── useCodebaseIndex.ts      ← NEW
│       │   └── useVoiceBridge.ts
│       │
│       └── lib/
│           ├── kanban-store.ts
│           └── agent-engine.ts          ← NEW: FSM logic
│
└── src/demo/mock-data/
    └── kanban.json
```

---

## 9. Environment Variables

```bash
# ─── Local LLM ─────────────────────────────────
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:16b

# ─── CopilotKit (kept for chat sidebar) ────────
OPENAI_API_KEY=sk-...            # Fallback for CopilotKit chat
OPENAI_MODEL=gpt-4o

# ─── GitHub (for PR creation) ──────────────────
GITHUB_TOKEN=github_pat_...
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo

# ─── CopilotKit Config ─────────────────────────
CLAWPILOT_MODE=standalone
NEXT_PUBLIC_CLAWPILOT_MODE=standalone

# ─── DEPRECATED (being replaced) ───────────────
# VAPI_API_KEY=...              (replaced by local Whisper)
# NEXT_PUBLIC_VAPI_PUBLIC_KEY=  (replaced by local Whisper)
```

---

## 10. Dependencies

### Core (existing)

```json
{
  "next": "14.x",
  "@copilotkit/react-core": "^1.x",
  "@copilotkit/react-ui": "^1.x",
  "@copilotkit/runtime": "^1.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x"
}
```

### New Dependencies to Add

```json
{
  "ollama": "^0.5.x", // Official Ollama Node.js client
  "@octokit/rest": "^21.x", // GitHub API for PR creation
  "fast-glob": "^3.x", // Fast file system globbing for indexer
  "nodejs-whisper": "^0.x", // Local Whisper STT
  "ignore": "^5.x", // .gitignore parsing for indexer
  "simple-git": "^3.x" // Git wrapper (nicer than child_process)
}
```

---

## 11. Development Setup

### Prerequisites

```bash
# 1. Install Ollama
# Windows: https://ollama.com/download/windows
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull the coding model
ollama pull deepseek-coder-v2:16b

# 3. Verify Ollama is running
curl http://localhost:11434/api/tags

# 4. Install Whisper (via node)
# Handled automatically by nodejs-whisper on first use
```

### Running the Application

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Verify at http://localhost:3000
```

### First-Time Usage

1. Open `http://localhost:3000`
2. Click "Link Project" in the header → enter path to your project
3. Wait for indexing to complete
4. Add a task in the "To Do" column
5. Click ⚡ Execute to have the agent work on it

---

## 12. Security Model

### Sandboxing

The agent can **only read and write files within the linked project directory**. Every file operation checks that the resolved absolute path starts with the project root:

```typescript
function assertSafe(filePath: string, projectRoot: string): void {
  const resolved = path.resolve(projectRoot, filePath);
  if (!resolved.startsWith(path.resolve(projectRoot))) {
    throw new Error(
      `SECURITY VIOLATION: Path ${filePath} is outside project root`,
    );
  }
}
```

### Git Safety

- Agent **never** pushes to `main` or `master` directly
- All work happens on `agent/task-*` branches
- PRs are created, never auto-merged
- Branch protection via GitHub repository settings recommended

### Local Network

- Ollama and Whisper communicate only on `localhost`
- No audio or code is sent to external services
- GitHub API calls are gated behind explicit `GITHUB_TOKEN` configuration

### What the Agent CAN Do

- Read any file within the linked project folder
- Write/create files within the linked project folder
- Run `npm test` (configurable)
- Create git commits and push branches
- Open GitHub PRs

### What the Agent CANNOT Do

- Access files outside the linked project folder
- Run arbitrary shell commands (only whitelisted: `git`, `npm test`)
- Auto-merge PRs or modify protected branches
- Access other services, APIs, or the internet (except GitHub API for PRs)

---

_End of Architecture Document_
