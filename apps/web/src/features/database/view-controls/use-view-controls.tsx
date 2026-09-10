import { useFormSubmit } from "@/hooks/use-form-submit";
import { z } from "zod";
import { useForm, useStore } from "@tanstack/react-form";
import { viewSchema } from "@digipm/contracts";
import { useEffect, useRef, useState } from "react";
import { viewSorts, type ViewConfig } from "@digipm/contracts";
import { type DatabaseProperty, type FilterRule } from "./shared";
import { orderedColumnIds } from "./ordered-column-ids";
import { newFilter } from "./new-filter";

export function useViewControls({
  filtersOnly = false,
  config,
  properties,
  members,
  onChange,
  onAddProperty,
  filterRequest,
}: {
  filtersOnly?: boolean;
  config: ViewConfig;
  properties: DatabaseProperty[];
  members: { id: string; name: string }[];
  onChange: (config: ViewConfig) => void;
  onAddProperty?: () => void;
  filterRequest: { id: string; key: number } | null;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterForm = useForm({
    defaultValues: { filters: config.filters, filterMode: config.filterMode },
    validators: {
      onSubmit: z.object({
        filters: viewSchema.shape.filters.removeDefault(),
        filterMode: viewSchema.shape.filterMode.removeDefault(),
      }),
    },
    onSubmit: ({ value }) => {
      onChange({ ...config, ...value });
      setFilterOpen(false);
    },
  });
  const submitFilterform = useFormSubmit(filterForm);
  const { filters, filterMode: mode } = useStore(
    filterForm.store,
    (state) => state.values,
  );
  const setFilters = (
    value:
      | ViewConfig["filters"]
      | ((current: ViewConfig["filters"]) => ViewConfig["filters"]),
  ) => filterForm.setFieldValue("filters", value);
  const setMode = (value: ViewConfig["filterMode"]) =>
    filterForm.setFieldValue("filterMode", value);
  const sorts = viewSorts(config);
  const fields = [{ id: "title", name: "Nom" }, ...properties];
  const order = orderedColumnIds(properties, config);
  const handledRequest = useRef(filterRequest);
  useEffect(() => {
    if (!filterRequest || handledRequest.current === filterRequest) return;
    handledRequest.current = filterRequest;
    setFilters([
      ...config.filters.slice(0, 19),
      newFilter(filterRequest.id, properties),
    ]);
    setMode(config.filterMode);
    setFilterOpen(true);
  }, [filterRequest, config.filters, config.filterMode, properties]);
  const patchFilter = (index: number, patch: Partial<FilterRule>) =>
    setFilters((current) =>
      current.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  const setSorts = (next: ViewConfig["sorts"]) =>
    onChange({
      ...config,
      sortBy: "position",
      sortDirection: "asc",
      sorts: next,
    });
  return {
    filterOpen,
    setFilters,
    config,
    setMode,
    setFilterOpen,
    submitFilterform,
    filters,
    mode,
    properties,
    members,
    patchFilter,
    fields,
    filterForm,
    filtersOnly,
    sorts,
    setSorts,
    order,
    onChange,
    onAddProperty,
  };
}
