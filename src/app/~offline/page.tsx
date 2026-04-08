export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="ui-surface max-w-sm p-8 text-center">
        <p className="text-foreground text-lg font-semibold tracking-tight">
          You are offline
        </p>
        <p className="text-muted mt-3 text-sm leading-relaxed">
          Reconnect to load the latest challenge feed and check-ins.
        </p>
      </div>
    </div>
  );
}
