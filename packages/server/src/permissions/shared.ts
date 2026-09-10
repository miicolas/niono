import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

export const organizationAccess = createAccessControl({
  ...defaultStatements,
  content: ["read", "write"],
});

export const organizationRoles = {
  owner: organizationAccess.newRole({
    ...ownerAc.statements,
    content: ["read", "write"],
  }),
  admin: organizationAccess.newRole({
    ...adminAc.statements,
    content: ["read", "write"],
  }),
  member: organizationAccess.newRole({
    ...memberAc.statements,
    content: ["read", "write"],
  }),
  editor: organizationAccess.newRole({
    ...memberAc.statements,
    content: ["read", "write"],
  }),
  viewer: organizationAccess.newRole({
    ...memberAc.statements,
    content: ["read"],
  }),
};
