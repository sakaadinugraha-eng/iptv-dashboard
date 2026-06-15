export interface TVChannel {
  id: string;
  name: string;
  logo: string | null;
  country: string;
  category: string;
  streamUrl: string;
}

export async function getChannels(customStreamsUrl?: string): Promise<TVChannel[]> {
  try {
    const defaultChannelsUrl = 'https://iptv-org.github.io/api/channels.json';
    const streamsUrl = customStreamsUrl || 'https://iptv-org.github.io/api/streams.json';

    const [channelsRes, streamsRes] = await Promise.all([
      fetch(defaultChannelsUrl, { cache: 'no-store' }),
      fetch(streamsUrl, { cache: 'no-store' })
    ]);

    if (!channelsRes.ok || !streamsRes.ok) {
      throw new Error('Failed to fetch data from IPTV server');
    }

    const channelsData = await channelsRes.json();
    const streamsData = await streamsRes.json();

    const streamMap = new Map<string, string>();
    streamsData.forEach((stream: any) => {
      if (stream.url && stream.channel) {
        streamMap.set(stream.channel, stream.url);
      }
    });

    const indonesianChannels: TVChannel[] = [];
    const globalChannels: TVChannel[] = [];
    
    channelsData.forEach((channel: any) => {
      const streamUrl = streamMap.get(channel.id);
      
      if (streamUrl) {
        const cleanName = channel.name
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/\[.*?\]/g, '')
          .trim();

        const countryCode = typeof channel.country === 'string' ? channel.country.toUpperCase() : 'GLOBAL';
        const isIndonesia = countryCode === 'ID';

        const formattedChannel: TVChannel = {
          id: channel.id,
          name: cleanName,
          logo: channel.logo || null,
          country: countryCode,
          category: channel.categories?.[0] || 'General',
          streamUrl: streamUrl,
        };

        if (isIndonesia) {
          indonesianChannels.push(formattedChannel);
        } else {
          globalChannels.push(formattedChannel);
        }
      }
    });

    const sortByName = (a: TVChannel, b: TVChannel) => a.name.localeCompare(b.name);
    indonesianChannels.sort(sortByName);
    globalChannels.sort(sortByName);

    return [...indonesianChannels, ...globalChannels];

  } catch (error) {
    console.error('Error fetching IPTV data:', error);
    return [];
  }
}