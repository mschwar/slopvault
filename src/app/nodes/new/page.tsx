import { Suspense } from "react";
import { NodeCreateView } from "@/components/nodes/NodeCreateView";

export default function NodeCreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <NodeCreateView />
    </Suspense>
  );
}
