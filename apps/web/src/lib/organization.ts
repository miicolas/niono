import { authClient, authResult } from "./auth-client";

/** People suggestions use user IDs; Better Auth's membership ID is a separate identity. */
export async function listWorkspacePeople(organizationId: string) {
  const result = authResult(
    await authClient.organization.listMembers({
      query: {
        organizationId,
        limit: 100,
        sortBy: "createdAt",
        sortDirection: "asc",
      },
    }),
  );
  return result.members.map((member) => ({
    id: member.userId,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
  }));
}
