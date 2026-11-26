export default function AccessDeniedPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">Access unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your business role does not have permission to open this page.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Use the sidebar to open an available section or ask the business owner
        to update your role.
      </p>
    </main>
  );
}
