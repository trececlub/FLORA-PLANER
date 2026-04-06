"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ChatAutoRefresh({ intervalMs = 12000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    function refresh() {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    }

    const interval = window.setInterval(refresh, intervalMs);
    return () => {
      window.clearInterval(interval);
    };
  }, [router, intervalMs]);

  return null;
}
