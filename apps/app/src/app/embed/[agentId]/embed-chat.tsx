"use client";

import { useEffect, useRef, useState } from "react";

import { ChatPanel } from "@/components/chat-panel";

function useWidgetSession(agentId: string) {
  const [ids, setIds] = useState<{ conversationId: string; visitorId: string } | null>(null);

  useEffect(() => {
    const visitorKey = "amueai_visitor_id";
    const conversationKey = `amueai_conversation_${agentId}`;

    let visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(visitorKey, visitorId);
    }

    let conversationId = localStorage.getItem(conversationKey);
    if (!conversationId) {
      conversationId = crypto.randomUUID();
      localStorage.setItem(conversationKey, conversationId);
    }

    setIds({ conversationId, visitorId });
  }, [agentId]);

  return ids;
}

const FULLSCREEN_BREAKPOINT_PX = 480;

function useParentBridge(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let rafId: number;
    const resizeObserver = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        window.parent.postMessage({ type: "amueai:resize", height: entry.contentRect.height }, "*");
      });
    });
    resizeObserver.observe(root);

    let wasFullscreen: boolean | null = null;
    const mediaQuery = window.matchMedia(`(max-width: ${FULLSCREEN_BREAKPOINT_PX}px)`);
    const reportFullscreen = () => {
      if (mediaQuery.matches === wasFullscreen) return;
      wasFullscreen = mediaQuery.matches;
      window.parent.postMessage({ type: "amueai:fullscreen", value: mediaQuery.matches }, "*");
    };
    reportFullscreen();
    mediaQuery.addEventListener("change", reportFullscreen);

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.parent.postMessage({ type: "amueai:close" }, "*");
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", reportFullscreen);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [rootRef]);
}

export function EmbedChat({
  agentId,
  welcomeMessage,
}: {
  agentId: string;
  welcomeMessage: string;
}) {
  const session = useWidgetSession(agentId);
  const rootRef = useRef<HTMLDivElement>(null);
  useParentBridge(rootRef);

  return (
    <div className="h-full w-full" id="chat-root" ref={rootRef}>
      {session && (
        <ChatPanel
          agentId={agentId}
          conversationId={session.conversationId}
          visitorId={session.visitorId}
          welcomeMessage={welcomeMessage}
        />
      )}
    </div>
  );
}
