import { cva } from "class-variance-authority";
import { TabsTrigger } from "@/components/ui/tabs";
import type { personalTabs } from "./shared";

const labelVariants = cva("settings-nav-label", {
  variants: { group: { personal: "", workspace: "settings-nav-workspace" } },
});

export function SettingsTabGroup({
  label,
  tabs,
  group,
}: {
  label: string;
  tabs: typeof personalTabs;
  group: "personal" | "workspace";
}) {
  return (
    <>
      <span className={labelVariants({ group })}>{label}</span>
      {tabs.map(({ id, label, icon: Icon }) => (
        <TabsTrigger
          className="settings-nav-item"
          key={id}
          value={id}
          title={label}
        >
          <Icon width={17} height={17} aria-hidden="true" />
          <span>{label}</span>
        </TabsTrigger>
      ))}
    </>
  );
}
