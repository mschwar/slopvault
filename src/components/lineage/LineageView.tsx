"use client";

import Link from "next/link";
import type { NodeLineage, LineageNode } from "@/lib/nodes/lineage";

interface LineageViewProps {
  lineage: NodeLineage;
  currentNodeId: string;
}

function LineageCard({
  node,
  isCurrent,
  label,
}: {
  node: LineageNode;
  isCurrent?: boolean;
  label?: string;
}) {
  return (
    <div
      className={`relative rounded border p-3 ${
        isCurrent
          ? "border-orange-500/50 bg-orange-500/5"
          : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
      }`}
    >
      {label && (
        <span className="absolute -top-2 left-2 bg-gray-950 px-1 text-[10px] uppercase tracking-wider text-gray-500">
          {label}
        </span>
      )}
      <Link href={`/p/nodes/${node.id}`} className="block">
        <h4 className="truncate text-sm font-medium text-gray-200">
          {node.title}
        </h4>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>by {node.pseudonym}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-orange-500">
            <span>▲</span>
            {node.upvotes}
          </span>
          {node.forkCount > 0 && (
            <>
              <span>•</span>
              <span className="text-purple-400">{node.forkCount} forks</span>
            </>
          )}
        </div>
      </Link>
    </div>
  );
}

function SiblingCard({ node }: { node: LineageNode }) {
  return (
    <div className="rounded border border-gray-800 bg-gray-900/30 p-2 hover:border-gray-700">
      <Link href={`/p/nodes/${node.id}`} className="block">
        <h4 className="truncate text-xs font-medium text-gray-300">
          {node.title}
        </h4>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
          <span className="text-orange-500">▲ {node.upvotes}</span>
          {node.forkCount > 0 && (
            <span className="text-purple-400">• {node.forkCount}f</span>
          )}
        </div>
      </Link>
    </div>
  );
}

export function LineageView({ lineage, currentNodeId }: LineageViewProps) {
  const { parent, children, siblings, depth } = lineage;
  const hasLineage = parent || children.length > 0 || siblings.length > 0;

  if (!hasLineage) {
    return (
      <div className="rounded border border-gray-800 bg-gray-900/30 p-4">
        <p className="text-sm text-gray-500">
          This is an original node with no forks yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Depth indicator */}
      {depth > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="text-purple-400">Fork depth: {depth}</span>
          <span>•</span>
          <span>Part of a remix chain</span>
        </div>
      )}

      {/* Parent */}
      {parent && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Forked From
          </h4>
          <LineageCard node={parent} label="Parent" />
        </div>
      )}

      {/* Siblings - Other forks of the same parent */}
      {siblings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Related Forks ({siblings.length})
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {siblings.slice(0, 4).map((sibling) => (
              <SiblingCard key={sibling.id} node={sibling} />
            ))}
          </div>
          {siblings.length > 4 && (
            <p className="text-xs text-gray-600">
              +{siblings.length - 4} more forks
            </p>
          )}
        </div>
      )}

      {/* Current node indicator */}
      <div className="flex items-center justify-center">
        <div className="h-px flex-1 bg-gray-800" />
        <span className="mx-3 text-[10px] uppercase tracking-wider text-gray-600">
          Current
        </span>
        <div className="h-px flex-1 bg-gray-800" />
      </div>

      {/* Children - Forks of this node */}
      {children.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Forks ({children.length})
          </h4>
          <div className="space-y-2">
            {children.map((child) => (
              <LineageCard key={child.id} node={child} />
            ))}
          </div>
          {children.length >= 10 && (
            <p className="text-xs text-gray-600">
              Showing 10 most recent forks
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function LineageMini({
  forkCount,
  parentNodeId,
  nodeId,
}: {
  forkCount: number;
  parentNodeId: string | null;
  nodeId: string;
}) {
  if (forkCount === 0 && !parentNodeId) return null;

  return (
    <div className="flex items-center gap-3 text-xs">
      {parentNodeId && (
        <Link
          href={`/p/nodes/${parentNodeId}`}
          className="text-gray-500 hover:text-gray-300"
        >
          ← Forked
        </Link>
      )}
      {forkCount > 0 && (
        <Link
          href={`/p/nodes/${nodeId}#lineage`}
          className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
        >
          <span>{forkCount} fork{forkCount === 1 ? "" : "s"}</span>
          <span>→</span>
        </Link>
      )}
    </div>
  );
}
