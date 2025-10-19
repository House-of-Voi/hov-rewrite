export default function Placeholder({ title = 'PLACEHOLDER', detail }: { title?: string; detail?: string }) {
  return (
    <div className="placeholder">
      <div className="font-semibold">{title}</div>
      <p className="mt-2">{detail ?? 'This feature is not implemented yet.'}</p>
    </div>
  );
}
