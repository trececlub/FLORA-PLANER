"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;

function sendHeartbeat() {
  fetch("/api/presence/heartbeat", {
    method: "POST",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {
    // Best effort status ping.
  });
}

export function PresenceHeartbeat() {
  useEffect(() => {
    sendHeartbeat();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      sendHeartbeat();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
