import { AppShell } from '@/components/AppShell';

async function getInitialQuotes() {
  try {
    const fredApiKey = process.env.FRED_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/quotes`, {
      headers: fredApiKey ? { 'x-fred-api-key': fredApiKey } : {},
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    // Avoid noisy logs during `next build` / prerender where network access may be restricted.
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch initial quotes:', error);
    }
    return null;
  }
}

export default async function Home() {
  const initialData = await getInitialQuotes();

  return (
    <main>
      <AppShell initialData={initialData} />
    </main>
  );
}
