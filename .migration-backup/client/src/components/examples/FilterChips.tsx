import FilterChips from "../FilterChips";

export default function FilterChipsExample() {
  return (
    <div className="p-4">
      <FilterChips onFilterChange={(filter) => console.log("Selected:", filter)} />
    </div>
  );
}
