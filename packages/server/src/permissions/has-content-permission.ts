import { organizationRoles } from "./shared";

export function hasContentPermission(
  role: string | undefined,
  action: "read" | "write",
) {
  return (role ?? "").split(",").some((name) => {
    const entry = Object.entries(organizationRoles).find(
      ([key]) => key === name.trim(),
    );
    return entry?.[1].authorize({ content: [action] }).success ?? false;
  });
}
