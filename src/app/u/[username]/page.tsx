import { notFound } from "next/navigation";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  if (!username) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Profile: {username}</h1>
    </div>
  );
}