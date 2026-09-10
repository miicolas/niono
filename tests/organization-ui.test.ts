// @vitest-environment happy-dom
import { createElement as h } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationSettings } from "../apps/web/src/features/workspace/organization-settings";

const organization = vi.hoisted(() => ({
  listMembers: vi.fn(),
  hasPermission: vi.fn(),
  listInvitations: vi.fn(),
  listTeams: vi.fn(),
  listUserTeams: vi.fn(),
  createTeam: vi.fn(),
  addTeamMember: vi.fn(),
  inviteMember: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
}));
vi.mock("../apps/web/src/lib/auth-client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../apps/web/src/lib/auth-client")>();
  return { ...actual, authClient: { organization } };
});
HTMLElement.prototype.scrollIntoView ??= () => {};
const clients: QueryClient[] = [];
beforeEach(() => {
  vi.resetAllMocks();
  organization.listMembers.mockResolvedValue({
    data: {
      total: 1,
      members: [
        {
          id: "membership-id",
          userId: "user-id",
          role: "editor",
          user: { id: "user-id", name: "Alice", email: "alice@example.test" },
        },
      ],
    },
    error: null,
  });
  organization.hasPermission.mockResolvedValue({
    data: { success: true },
    error: null,
  });
  organization.listInvitations.mockResolvedValue({ data: [], error: null });
  organization.listTeams.mockResolvedValue({ data: [], error: null });
  organization.listUserTeams.mockResolvedValue({ data: [], error: null });
  organization.inviteMember.mockResolvedValue({
    data: { id: "invitation-id" },
    error: null,
  });
  organization.removeMember.mockResolvedValue({
    data: { id: "membership-id" },
    error: null,
  });
  organization.updateMemberRole.mockResolvedValue({
    data: { id: "membership-id" },
    error: null,
  });
  organization.createTeam.mockResolvedValue({
    data: { id: "team-id" },
    error: null,
  });
  organization.addTeamMember.mockResolvedValue({
    data: { id: "team-membership-id" },
    error: null,
  });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});
function show(tab: "members" | "teams") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return render(
    h(
      QueryClientProvider,
      { client },
      h(OrganizationSettings, {
        organizationId: "organization-id",
        userId: "owner-id",
        tab,
      }),
    ),
  );
}

test("le formulaire valide l’email et invite via Better Auth avec le rôle choisi", async () => {
  show("members");
  fireEvent.click(
    await screen.findByRole("button", { name: "Envoyer l’invitation" }),
  );
  await screen.findByText("Saisissez une adresse email valide.");
  expect(organization.inviteMember).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Inviter un membre"), {
    target: { value: "invited@example.test" },
  });
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Rôle de l’invité" }),
    { key: "ArrowDown" },
  );
  fireEvent.click(
    await screen.findByRole("option", { name: "Peut consulter" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Envoyer l’invitation" }));
  await waitFor(() =>
    expect(organization.inviteMember).toHaveBeenCalledWith({
      organizationId: "organization-id",
      email: "invited@example.test",
      role: "viewer",
    }),
  );
});

test("changer ou retirer un membre transmet son identifiant d’appartenance Better Auth", async () => {
  show("members");
  fireEvent.keyDown(
    await screen.findByRole("combobox", { name: "Rôle de Alice" }),
    { key: "ArrowDown" },
  );
  fireEvent.click(
    await screen.findByRole("option", { name: "Peut consulter" }),
  );
  await waitFor(() =>
    expect(organization.updateMemberRole).toHaveBeenCalledWith({
      organizationId: "organization-id",
      memberId: "membership-id",
      role: "viewer",
    }),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("combobox", { name: "Rôle de Alice" })
        .getAttribute("data-disabled"),
    ).toBeNull(),
  );
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Rôle de Alice" }), {
    key: "ArrowDown",
  });
  fireEvent.click(
    await screen.findByRole("option", { name: "Retirer de l’espace" }),
  );
  await waitFor(() =>
    expect(organization.removeMember).toHaveBeenCalledWith({
      organizationId: "organization-id",
      memberIdOrEmail: "membership-id",
    }),
  );
});

test("les permissions Better Auth contrôlent les actions proposées dans les paramètres", async () => {
  organization.hasPermission.mockResolvedValue({
    data: { success: false },
    error: null,
  });
  show("members");
  await screen.findByText("Alice");
  await waitFor(() => expect(organization.hasPermission).toHaveBeenCalled());
  expect(screen.queryByRole("combobox", { name: "Rôle de Alice" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Envoyer l’invitation" }),
  ).toBeNull();
  expect(organization.listInvitations).not.toHaveBeenCalled();
});

test("créer une équipe utilise Better Auth et y ajoute le créateur", async () => {
  show("teams");
  fireEvent.change(await screen.findByLabelText("Nouvelle équipe"), {
    target: { value: "Design" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Créer l’équipe" }));
  await waitFor(() =>
    expect(organization.createTeam).toHaveBeenCalledWith({
      organizationId: "organization-id",
      name: "Design",
    }),
  );
  await waitFor(() =>
    expect(organization.addTeamMember).toHaveBeenCalledWith({
      organizationId: "organization-id",
      teamId: "team-id",
      userId: "owner-id",
    }),
  );
});
