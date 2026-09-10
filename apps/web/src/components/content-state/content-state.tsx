import { useId, type ReactNode } from "react";
import { FileQuestion, type LucideIcon } from "lucide-react";
import { Empty, EmptyHeader, EmptyContent } from "@/components/ui/empty";

export function ContentState({
  icon: Icon = FileQuestion,
  title,
  description,
  children,
  compact = false,
  alert = false,
  headingLevel = 2,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
  alert?: boolean;
  headingLevel?: 1 | 2 | 3;
}) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <Empty
      className={`content-state${compact ? " content-state-compact" : ""}`}
    >
      <div className="state-illustration" aria-hidden="true">
        <div className="state-illustration-sheet">
          <Icon strokeWidth={1.4} />
        </div>
      </div>
      <EmptyHeader
        className="content-state-copy"
        role={alert ? "alert" : undefined}
        aria-labelledby={titleId}
      >
        <Heading id={titleId} className="content-state-title">
          {title}
        </Heading>
        <p className="content-state-description">{description}</p>
      </EmptyHeader>
      {children && (
        <EmptyContent className="content-state-actions">
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}
