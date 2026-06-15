import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://iptv-org.github.io/api/channels.json', {
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Gagal mengambil data dari server IPTV' }, { status: 500 });
    }

    const data = await response.json();

    const cleanChannels = data
      .filter((item: any) => item.url)
      .map((item: any, index: number) => {
        const uniqueId = item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + `-${index}`;
        
        return {
          id: uniqueId,
          name: item.name,
          logo: item.logo || null,
          country: item.countries?.[0]?.name || 'Global',
          category: item.categories?.[0]?.name || 'General',
          streamUrl: item.url,
        };
      });

    return NextResponse.json(cleanChannels);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}