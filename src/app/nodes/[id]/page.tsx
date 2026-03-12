import { NodeDetailView } from "@/components/nodes/NodeDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NodeDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <NodeDetailView nodeId={id} />;
}
