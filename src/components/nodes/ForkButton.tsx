"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ForkButtonProps {
  nodeId: string;
  forkCount: number;
}

export function ForkButton({ nodeId, forkCount }: ForkButtonProps) {
  const [isForking, setIsForking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleFork = async () => {
    setIsForking(true);
    try {
      const res = await fetch(`/api/nodes/${nodeId}/fork`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setShowSuccess(true);
        // Redirect to the new forked node after a brief delay
        setTimeout(() => {
          router.push(`/nodes/${data.node.id}`);
        }, 1000);
      } else if (res.status === 401) {
        // Redirect to sign in
        router.push("/auth/signin");
      } else {
        console.error("Fork failed:", await res.text());
      }
    } catch (err) {
      console.error("Fork error:", err);
    } finally {
      setIsForking(false);
    }
  };

  if (showSuccess) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400"
      >
        <span>✓</span>
        <span>Forked! Redirecting...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleFork}
      disabled={isForking}
      className="flex items-center gap-2 rounded border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/20 disabled:opacity-50"
    >
      {isForking ? (
        <>
          <span className="animate-pulse">⧗</span>
          <span>Forking...</span>
        </>
      ) : (
        <>
          <span>⧉</span>
          <span>Fork{forkCount > 0 ? ` (${forkCount})` : ""}</span>
        </>
      )}
    </button>
  );
}
