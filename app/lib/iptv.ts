import parser from 'iptv-playlist-parser';

export interface TVChannel {
  id: string;
  name: string;
  logo: string | null;
  country: string;
  countryName: string;
  countryFlag: string;
  category: string;
  categoryDescription: string | null;
  streamUrl: string;
  quality: string | null;
  languages: string[];
  subdivision: string | null;
  epgUrl: string | null;
  epgSiteId: string | null; 
}

interface ApiChannel {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  categories?: string[];
  languages?: string[];
  subdivision?: string;
}

interface ApiCountry {
  code: string;
  name: string;
  flag?: string;
  languages?: string[];
}

interface ApiLanguage {
  code: string;
  name: string;
}

interface ApiSubdivision {
  code: string;
  name: string;
}

interface ApiLogo {
  channel: string;
  url: string;
  in_use?: boolean;
}

interface ApiStream {
  channel: string;
  url: string;
  quality?: string;
}

interface ApiBlocklist {
  channel?: string;
}

interface ApiCategory {
  id: string;
  name: string;
  description: string;
}

interface ApiGuide {
  channel: string;
  site_id: string;
  sources: { url: string }[];
}

function inferRegion(channelName: string, countryCode: string, apiSubdivision: string | null): string | null {
  if (apiSubdivision) return apiSubdivision;
  if (countryCode !== 'ID') return null;

  const nameLower = channelName.toLowerCase();
  const localRegions: Record<string, string[]> = {
    "Jawa Timur": ["jtv", "jawa timur", "surabaya", "malang", "kediri", "batu tv", "madura", "bbs tv"],
    "Jawa Tengah": ["jawa tengah", "semarang", "surakarta", "bms tv"],
    "Jawa Barat": ["jawa barat", "bandung", "mqtv", "pajajaran"],
    "DKI Jakarta": ["jakarta", "betawi"],
    "DI Yogyakarta": ["jogja tv", "yogyakarta", "adi tv"],
    "Bali": ["bali tv", "bali"],
    "Sumatera": ["sumatera", "padang", "medan", "aceh", "riau tv"],
    "Kalimantan": ["kalimantan", "banjar tv", "duta tv", "balikpapan"],
    "Sulawesi": ["sulawesi", "makassar", "fajar tv", "kawanua"],
    "Papua": ["papua tv", "papua"],
    "TV Daerah Lainnya": ["lokal", "daerah"]
  };

  for (const [region, keywords] of Object.entries(localRegions)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      return region;
    }
  }
  return null;
}

export async function getIptvOrgChannels(customStreamsUrl?: string): Promise<TVChannel[]> {
  try {
    const defaultChannelsUrl = 'https://iptv-org.github.io/api/channels.json';
    const countriesUrl = 'https://iptv-org.github.io/api/countries.json';
    const streamsUrl = customStreamsUrl || 'https://iptv-org.github.io/api/streams.json';
    const blocklistUrl = 'https://iptv-org.github.io/api/blocklist.json';
    const logosUrl = 'https://iptv-org.github.io/api/logos.json';
    const languagesUrl = 'https://iptv-org.github.io/api/languages.json';
    const subdivisionsUrl = 'https://iptv-org.github.io/api/subdivisions.json';
    const categoriesUrl = 'https://iptv-org.github.io/api/categories.json';
    const guidesUrl = 'https://iptv-org.github.io/api/guides.json'; 

    const fetchOptions: RequestInit = { cache: 'force-cache' };

    const [
      channelsRes, countriesRes, streamsRes, blocklistRes, 
      logosRes, languagesRes, subdivisionsRes, categoriesRes, guidesRes
    ] = await Promise.all([
      fetch(defaultChannelsUrl, fetchOptions),
      fetch(countriesUrl, fetchOptions),
      fetch(streamsUrl, fetchOptions),
      fetch(blocklistUrl, fetchOptions),
      fetch(logosUrl, fetchOptions),
      fetch(languagesUrl, fetchOptions),
      fetch(subdivisionsUrl, fetchOptions),
      fetch(categoriesUrl, fetchOptions),
      fetch(guidesUrl, fetchOptions) 
    ]);

    const failedResponses = [
      channelsRes, countriesRes, streamsRes, blocklistRes, 
      logosRes, languagesRes, subdivisionsRes, categoriesRes, guidesRes
    ].filter((res) => !res.ok);

    if (failedResponses.length > 0) {
      throw new Error(`Failed fetching IPTV data (${failedResponses.map((r) => r.status).join(', ')})`);
    }

    const [
      channelsData, countriesData, streamsData, blocklistData, 
      logosData, languagesData, subdivisionsData, categoriesData, guidesData
    ] = await Promise.all([
      channelsRes.json() as Promise<ApiChannel[]>,
      countriesRes.json() as Promise<ApiCountry[]>,
      streamsRes.json() as Promise<ApiStream[]>,
      blocklistRes.json() as Promise<ApiBlocklist[]>,
      logosRes.json() as Promise<ApiLogo[]>,
      languagesRes.json() as Promise<ApiLanguage[]>,
      subdivisionsRes.json() as Promise<ApiSubdivision[]>,
      categoriesRes.json() as Promise<ApiCategory[]>,
      guidesRes.json() as Promise<ApiGuide[]> 
    ]);

    const languageMap = new Map<string, string>();
    languagesData?.forEach((lang) => { if (lang.code && lang.name) languageMap.set(lang.code.toLowerCase(), lang.name); });

    const subdivisionMap = new Map<string, string>();
    subdivisionsData?.forEach((sub) => { if (sub.code) subdivisionMap.set(sub.code, sub.name); });

    const categoryMap = new Map<string, { name: string, description: string }>();
    categoriesData?.forEach((cat) => { if (cat.id) categoryMap.set(cat.id.toLowerCase(), { name: cat.name, description: cat.description }); });

    const blockedIds = new Set<string>();
    blocklistData?.forEach((item) => { if (item.channel) blockedIds.add(item.channel); });

    const countryMap = new Map<string, { name: string; flag: string; defaultLangs: string[] }>();
    countriesData?.forEach((country) => {
      if (country.code) {
        countryMap.set(country.code.toUpperCase(), { name: country.name, flag: country.flag || '🌐', defaultLangs: country.languages || [] });
      }
    });

    const logoMap = new Map<string, string>();
    logosData?.forEach((logo) => {
      if (!logo.channel || !logo.url) return;
      if (!logoMap.has(logo.channel) || logo.in_use === true) logoMap.set(logo.channel, logo.url);
    });

    const streamMap = new Map<string, { url: string, quality: string | null }>();
    streamsData?.forEach((stream) => {
      if (stream.channel && stream.url && !streamMap.has(stream.channel)) {
        streamMap.set(stream.channel, { url: stream.url, quality: stream.quality || null });
      }
    });

    const guideMap = new Map<string, { siteId: string, url: string }>();
    guidesData?.forEach((guide) => {
      if (guide.channel && guide.site_id && guide.sources?.[0]?.url) {
        guideMap.set(guide.channel, { siteId: guide.site_id, url: guide.sources[0].url });
      }
    });

    const indonesianChannels: TVChannel[] = [];
    const globalChannels: TVChannel[] = [];

    const getLanguages = (channel: ApiChannel, countryInfo?: { name: string; flag: string; defaultLangs: string[] }): string[] => {
      const langs: string[] = [];
      if (Array.isArray(channel.languages)) {
        channel.languages.forEach((code) => {
          const langName = languageMap.get(code.toLowerCase());
          if (langName) langs.push(langName);
        });
      }
      if (langs.length === 0 && countryInfo?.defaultLangs) {
        countryInfo.defaultLangs.forEach((code) => {
          const langName = languageMap.get(code.toLowerCase());
          if (langName) langs.push(langName);
        });
      }
      return langs.length > 0 ? [...new Set(langs)] : ['Unknown'];
    };

    channelsData?.forEach((channel) => {
      if (!channel.id || blockedIds.has(channel.id)) return;

      const streamData = streamMap.get(channel.id);
      if (!streamData) return;

      const countryCode = channel.country?.toUpperCase() || '';
      const countryInfo = countryMap.get(countryCode);
      const cleanName = channel.name.trim();

      const apiSubdivisionName = channel.subdivision ? subdivisionMap.get(channel.subdivision) || null : null;
      const smartSubdivision = inferRegion(cleanName, countryCode, apiSubdivisionName);

      const rawCategory = channel.categories?.[0] || 'general';
      const categoryInfo = categoryMap.get(rawCategory.toLowerCase());
      
      const guideInfo = guideMap.get(channel.id);

      const formattedChannel: TVChannel = {
        id: channel.id,
        name: cleanName,
        logo: logoMap.get(channel.id) || channel.logo || null,
        country: countryCode || 'GLOBAL',
        countryName: countryInfo?.name || 'Global',
        countryFlag: countryInfo?.flag || '🌐',
        category: categoryInfo ? categoryInfo.name : 'General',
        categoryDescription: categoryInfo ? categoryInfo.description : null,
        streamUrl: streamData.url,
        quality: streamData.quality,
        languages: getLanguages(channel, countryInfo),
        subdivision: smartSubdivision,
        epgUrl: guideInfo ? guideInfo.url : null, 
        epgSiteId: guideInfo ? guideInfo.siteId : null
      };

      if (countryCode === 'ID') indonesianChannels.push(formattedChannel);
      else globalChannels.push(formattedChannel);
    });

    const sortByName = (a: TVChannel, b: TVChannel) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    indonesianChannels.sort(sortByName);
    globalChannels.sort(sortByName);

    return [...indonesianChannels, ...globalChannels];
  } catch (error) {
    console.error('Error fetching IPTV-Org data:', error);
    return [];
  }
}

export async function getFreeTvChannels(): Promise<TVChannel[]> {
  try {
    const fetchOptions: RequestInit = { cache: 'force-cache' };
    const response = await fetch('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', fetchOptions);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch Free TV playlist (${response.status})`);
    }

    const m3uText = await response.text();
    const parsed = parser.parse(m3uText);

    return parsed.items.map((item, index) => {
      const nameUpper = (item.name || "").toUpperCase();
      const groupTitle = item.group.title || 'Global';

      let quality = null;
      if (nameUpper.includes("1080P") || nameUpper.includes("FHD")) quality = "FHD";
      else if (nameUpper.includes("720P") || nameUpper.includes("HD")) quality = "HD";

      let guessedCategory = 'General';
      if (nameUpper.includes('SPORT') || nameUpper.includes('ESPN') || nameUpper.includes('BEIN')) guessedCategory = 'Sports';
      else if (nameUpper.includes('KIDS') || nameUpper.includes('CARTOON') || nameUpper.includes('NICKELODEON')) guessedCategory = 'Kids';
      else if (nameUpper.includes('NEWS') || nameUpper.includes('BERITA')) guessedCategory = 'News';
      else if (nameUpper.includes('MUSIC') || nameUpper.includes('MTV')) guessedCategory = 'Music';
      else if (nameUpper.includes('MOVIE') || nameUpper.includes('CINEMA') || nameUpper.includes('FILM')) guessedCategory = 'Movies';
      else if (nameUpper.includes('RELIGION') || nameUpper.includes('ISLAM') || nameUpper.includes('DAKWAH')) guessedCategory = 'Religious';

      const isIndonesia = groupTitle.toLowerCase().includes('indonesia') || nameUpper.includes('INDONESIA');

      return {
        id: `freetv-${index}`,
        name: item.name || 'Unknown Channel',
        logo: item.tvg.logo || null,
        
        country: isIndonesia ? 'ID' : 'GLOBAL', 
        countryName: groupTitle, 
        countryFlag: isIndonesia ? '🇮🇩' : '🌐',
        
        category: guessedCategory, 
        categoryDescription: null,
        streamUrl: item.url,
        quality: quality,
        
        languages: isIndonesia ? ['Indonesian'] : ['Unknown'], 
        subdivision: null,
        epgUrl: item.tvg.url || null,
        epgSiteId: item.tvg.id || null,
      };
    }).filter(ch => ch.streamUrl !== ""); 
  } catch (error) {
    console.error("Error fetching Free TV data:", error);
    return [];
  }
}