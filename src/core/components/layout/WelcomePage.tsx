"use client";

import { useMode } from "@/core/providers/ModeContext";

export function WelcomePage() {
  const { mode, isHybrid } = useMode();

  const agentDescription = isHybrid ? (
    <>
      two agents:{" "}
      <span className="text-blue-500 font-medium">@copilot</span> (your
      in-app AI) and{" "}
      <span className="text-amber-500 font-medium">@clawpilot</span>{" "}
      (OpenClaw gateway)
    </>
  ) : mode === "openclaw" ? (
    <>
      <span className="text-amber-500 font-medium">ClawPilot</span> via
      OpenClaw
    </>
  ) : (
    <>
      <span className="text-blue-500 font-medium">Copilot</span> powered by
      your LLM
    </>
  );

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          ClawUI Starter Kit
        </h1>
        <p className="mt-3 text-foreground/60">
          Build AI-powered UIs with {agentDescription}.
        </p>

        <div className="mt-2 inline-flex items-center rounded-full border border-foreground/10 px-3 py-1 text-xs text-foreground/50">
          Mode: <span className="ml-1 font-mono font-medium">{mode}</span>
        </div>

        <div className="mt-8 space-y-4 text-left">
          <Step number={1} title="Register an action">
            <code className="text-xs">
              {`useCopilotAction({ name: "myAction", handler: async (args) => { ... } })`}
            </code>
          </Step>
          <Step number={2} title="Expose your state">
            <code className="text-xs">
              {`useCopilotReadable({ description: "My data", value: myState })`}
            </code>
          </Step>
          <Step number={3} title="Chat with your agent">
            <p className="text-xs text-foreground/50">
              {isHybrid ? (
                <>
                  Use the sidebar to send messages to{" "}
                  <span className="text-blue-500">@copilot</span> or{" "}
                  <span className="text-amber-500">@clawpilot</span>.
                </>
              ) : (
                <>
                  Use the sidebar to chat. Your tools and state are
                  automatically available to the agent.
                </>
              )}
            </p>
          </Step>
        </div>

        <p className="mt-8 text-xs text-foreground/30">
          The kanban demo was in{" "}
          <code className="font-mono">src/demo/</code>. Check the README to
          restore it or build your own UI.
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold">
          {number}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="pl-8 text-foreground/60">{children}</div>
    </div>
  );
}
