export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
