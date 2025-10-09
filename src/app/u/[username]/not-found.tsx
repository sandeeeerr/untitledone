import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16">
      <div className="max-w-md mx-auto text-center space-y-3">
        <h1 className="text-xl font-semibold">Gebruiker niet gevonden</h1>
        <p className="text-sm text-muted-foreground">
          Het lijkt erop dat deze gebruiker niet bestaat of geen publiek profiel heeft.
        </p>
        <div className="pt-2">
          <Link href="/" className="text-sm underline text-muted-foreground hover:text-foreground">
            Ga terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
} 