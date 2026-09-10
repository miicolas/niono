import { Spinner } from "@/components/ui/spinner";

export function LoadingLabel({ children }: { children: string }) {
  return (
    <div className="loading-label" role="status">
      <Spinner aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
