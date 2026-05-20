import { createFileRoute, Navigate, Outlet, useMatch } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  component: ProfileLayout,
});

function ProfileLayout() {
  const { wallet } = useStore();

  // If a child route (e.g. /profile/$wallet) is active, just render it
  let hasChildRoute = false;
  try {
    useMatch({ from: "/profile/$wallet" });
    hasChildRoute = true;
  } catch {
    hasChildRoute = false;
  }

  if (hasChildRoute) {
    return <Outlet />;
  }

  // /profile with no wallet param — redirect to own profile or show connect prompt
  if (wallet) return <Navigate to="/profile/$wallet" params={{ wallet }} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Profile</span>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Connect your wallet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Once you connect, your fan profile, badges, and call history live here.
        </p>
      </div>
    </div>
  );
}