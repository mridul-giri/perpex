export function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-md bg-[rgb(253_75_78_/_0.12)] px-3 py-2 text-xs text-down">
      {message}
    </p>
  );
}
