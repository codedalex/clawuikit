"use client";

import dynamic from "next/dynamic";
import { SplitLayout } from "@/core/components/layout/SplitLayout";
import { ChatSidebar } from "@/core/components/chat/ChatSidebar";
import { WelcomePage } from "@/core/components/layout/WelcomePage";

let DemoComponent: React.ComponentType | null = null;

try {
  DemoComponent = dynamic(() => import("@/demo/KanbanDemo"), { ssr: false });
} catch {
  DemoComponent = null;
}

export default function Home() {
  const MainContent = DemoComponent ?? WelcomePage;

  return (
    <SplitLayout main={<MainContent />} sidebar={<ChatSidebar />} />
  );
}
