type RowProps = {
  label: string;
  value: string | number | null;
  className?: string;
};

/** One `<dt>`/`<dd>` pair of a `.dl-rows` list; a missing value shows as `(unset)`. */
export function Row({ label, value, className }: RowProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={className}>{value ?? "(unset)"}</dd>
    </>
  );
}

/** A row whose value turns green when it says `production`, as NODE_ENV and the bundle do. */
export function ModeRow({ label, value }: Omit<RowProps, "className">) {
  return (
    <Row label={label} value={value} className={value === "production" ? "dl-ok" : "dl-key"} />
  );
}
