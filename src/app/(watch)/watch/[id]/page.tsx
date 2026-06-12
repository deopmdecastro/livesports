import WatchExperience from "@/components/watch/WatchExperience";
import { serverApiRequest } from "@/lib/server-api";
import type { Live } from "@/types";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params;
  const live = await serverApiRequest<Live>(`/lives/${id}`);
  if (!live) notFound();

  return <WatchExperience live={live} liveId={id} />;
}
