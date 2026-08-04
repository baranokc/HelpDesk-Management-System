import { TeamMemberDetailContainer } from "@/src/components/team-management/TeamMemberDetailContainer";

interface TeamMemberDetailPageProps {
  params: Promise<{ memberId: string }>;
}

export default async function TeamMemberDetailPage({
  params,
}: TeamMemberDetailPageProps) {
  const { memberId } = await params;

  return <TeamMemberDetailContainer teamMemberId={memberId} />;
}
