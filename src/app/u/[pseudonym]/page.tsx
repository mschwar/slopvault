import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/profiles/service";

interface ProfilePageProps {
  params: Promise<{ pseudonym: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { pseudonym } = await params;
  const profile = await getUserProfile(pseudonym);
  
  if (!profile) {
    return { title: "Not Found | SlopVault" };
  }
  
  return {
    title: `${profile.profile.pseudonym} | SlopVault`,
    description: `Public nodes by ${profile.profile.pseudonym}`,
  };
}

function MediaTypeIcon({ types }: { types: string[] }) {
  const hasText = types.includes("text");
  const hasImage = types.includes("image");
  const hasAudio = types.includes("audio_link");

  return (
    <span className="flex gap-1 text-xs text-gray-500">
      {hasText && <span title="Text">T</span>}
      {hasImage && <span title="Image">I</span>}
      {hasAudio && <span title="Audio">A</span>}
    </span>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { pseudonym } = await params;
  const decodedPseudonym = decodeURIComponent(pseudonym);
  const profile = await getUserProfile(decodedPseudonym);

  if (!profile) {
    notFound();
  }

  const { profile: user, nodes, nodeCount } = profile;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/95">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href="/feed"
            className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-300"
          >
            ← Back to feed
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">
                {user.pseudonym}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-100">{nodeCount}</p>
              <p className="text-sm text-gray-500">
                public {nodeCount === 1 ? "node" : "nodes"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nodes list */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {nodes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No public nodes yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {nodes.map((node) => (
              <div key={node.id} className="py-4">
                <Link
                  href={`/p/nodes/${node.id}`}
                  className="block hover:opacity-80"
                >
                  <h3 className="text-base font-semibold text-gray-100">
                    {node.title}
                  </h3>
                  {node.hook && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                      {node.hook}
                    </p>
                  )}
                </Link>

                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-orange-500">▲</span>
                    {node.upvotes}
                  </span>
                  <span>•</span>
                  <span>{new Date(node.createdAt).toLocaleDateString()}</span>
                  <MediaTypeIcon types={node.mediaTypes} />
                  {node.forkCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-purple-400">
                        {node.forkCount} forks
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
