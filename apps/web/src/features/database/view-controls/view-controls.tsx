import { type ViewControlsProps } from "./view-controls-props";
import { useViewControls } from "./use-view-controls";
import { FilterControls } from "./filter-controls";
import { SortControls } from "./sort-controls";
import { PropertyControls } from "./property-controls";

export function ViewControls(props: ViewControlsProps) {
  const {
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
  } = useViewControls(props);
  return (
    <div className="database-controls">
      <FilterControls
        filterOpen={filterOpen}
        setFilters={setFilters}
        config={config}
        setMode={setMode}
        setFilterOpen={setFilterOpen}
        submitFilterform={submitFilterform}
        filters={filters}
        mode={mode}
        properties={properties}
        members={members}
        patchFilter={patchFilter}
        fields={fields}
        filterForm={filterForm}
      />
      {!filtersOnly && (
        <>
          <SortControls sorts={sorts} setSorts={setSorts} fields={fields} />
          <PropertyControls
            order={order}
            config={config}
            onChange={onChange}
            fields={fields}
            onAddProperty={onAddProperty}
          />
        </>
      )}
    </div>
  );
}
