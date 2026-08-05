export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[100dvh]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
        <p className="text-muted-foreground font-mono text-sm">System out of bounds.</p>
        <a href="/" className="inline-block mt-4 text-sm text-primary hover:underline">
          Return to base
        </a>
      </div>
    </div>
  );
}