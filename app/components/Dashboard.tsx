"use client";

import { useState, useMemo, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import { TVChannel } from "./../lib/iptv";
import EpgPanel from "./EpgPanel";

const FILTER_PRESETS = [
  { label: "All Channels", value: "All" },
  { label: "My Favorites", value: "Favorites" }, 
  { label: "Indonesia Only", value: "Indonesia" },
  { label: "Regional / Local", value: "Regional" },
  { label: "Sports Channels", value: "Sports" },
  { label: "Kids Channels", value: "Kids" }
];

interface DashboardProps {
  iptvOrgChannels: TVChannel[];
  freeTvChannels: TVChannel[];
}

export default function Dashboard({ iptvOrgChannels, freeTvChannels }: DashboardProps) {
  const [activeSource, setActiveSource] = useState<'IPTV-ORG' | 'FREE-TV'>('IPTV-ORG');
  
  const currentChannelsData = activeSource === 'IPTV-ORG' ? iptvOrgChannels : freeTvChannels;

  const [activeChannel, setActiveChannel] = useState<TVChannel | null>(
    currentChannelsData.length > 0 ? currentChannelsData[0] : null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPreset, setSelectedPreset] = useState<string>("All");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All"); 

  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  const [visibleCount, setVisibleCount] = useState<number>(100);

  useEffect(() => {
    setIsMounted(true);
    const savedFavorites = localStorage.getItem("iptv_favorites");
    if (savedFavorites) {
      try { setFavorites(JSON.parse(savedFavorites)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, selectedCategory, selectedPreset, selectedLanguage]);

  useEffect(() => {
    if (currentChannelsData.length > 0) {
      setActiveChannel(currentChannelsData[0]);
    } else {
      setActiveChannel(null);
    }
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPreset("All");
    setSelectedLanguage("All");
  }, [activeSource, currentChannelsData]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    let newFavorites = favorites.includes(id) ? favorites.filter((favId) => favId !== id) : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem("iptv_favorites", JSON.stringify(newFavorites));
  };

  const languagesList = useMemo(() => {
    const set = new Set<string>();
    currentChannelsData.forEach((channel) => {
      if (Array.isArray(channel.languages)) {
        channel.languages.forEach((lang) => {
          if (lang && lang !== "Unknown") set.add(lang);
        });
      }
    });
    return ["All", ...Array.from(set).sort()];
  }, [currentChannelsData]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, string | null>();
    currentChannelsData.forEach((channel) => {
      if (channel.category && !map.has(channel.category)) {
        map.set(channel.category, channel.categoryDescription);
      }
    });
    const sortedKeys = Array.from(map.keys()).sort();
    return [{ name: "All", description: "Show all channels" }, ...sortedKeys.map(key => ({ name: key, description: map.get(key) }))];
  }, [currentChannelsData]);

  const filteredChannels = useMemo(() => {
    return currentChannelsData.filter((channel) => {
      if (channel.name.toUpperCase().startsWith("[DANA KHUSUS]")) return false;

      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || channel.category === selectedCategory;
      const matchesLanguage = selectedLanguage === "All" || channel.languages.includes(selectedLanguage);

      let matchesPreset = true;
      if (selectedPreset === "Indonesia") matchesPreset = channel.country === "ID";
      else if (selectedPreset === "Regional") matchesPreset = channel.subdivision !== null; 
      else if (selectedPreset === "Sports") matchesPreset = channel.category.toLowerCase() === "sports";
      else if (selectedPreset === "Kids") matchesPreset = channel.category.toLowerCase() === "kids";
      else if (selectedPreset === "Favorites") matchesPreset = favorites.includes(channel.id);

      return matchesSearch && matchesCategory && matchesPreset && matchesLanguage;
    });
  }, [currentChannelsData, searchQuery, selectedCategory, selectedPreset, selectedLanguage, favorites]);

  const displayChannels = filteredChannels.slice(0, visibleCount);
  const hasMoreChannels = visibleCount < filteredChannels.length;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-100 font-sans text-black">
      
      <aside className="order-2 md:order-1 w-full md:w-[22rem] md:min-w-[22rem] h-[60%] md:h-full bg-white md:border-r border-t md:border-t-0 border-slate-200 flex flex-col z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="p-3 md:p-5 border-b border-slate-200 bg-white space-y-2 md:space-y-3 shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-black">
              IPTV Player Pro
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium">
              Showing {displayChannels.length} of {filteredChannels.length} Channels
            </p>
          </div>

          <div className="flex flex-col gap-1 mb-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Source Server</label>
            <select
              value={activeSource}
              onChange={(e) => setActiveSource(e.target.value as 'IPTV-ORG' | 'FREE-TV')}
              className="w-full px-2 py-2 text-xs md:text-sm font-bold bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 text-black cursor-pointer shadow-sm"
            >
              <option value="IPTV-ORG">IPTV-Org Database (Comprehensive)</option>
              <option value="FREE-TV">Free-TV M3U (High Quality)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Filter</label>
              <select
                value={selectedPreset}
                onChange={(e) => { setSelectedPreset(e.target.value); setSelectedCategory("All"); }}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer truncate"
              >
                {FILTER_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer truncate"
              >
                {languagesList.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all text-black"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-2" style={{ scrollbarWidth: 'thin' }}>
            {categoriesMap.map((cat) => {
              const isCatActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  title={cat.description || "No description available"}
                  className={`text-[10px] md:text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                    isCatActive ? "bg-black text-white shadow-sm" : "bg-slate-100 text-black hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-3 md:p-4 space-y-2 bg-slate-50">
          {displayChannels.length > 0 ? (
            <>
              {displayChannels.map((channel) => {
                const isActive = activeChannel?.id === channel.id;
                const isFavorite = favorites.includes(channel.id);
                
                return (
                  <div 
                    key={channel.id} 
                    onClick={() => setActiveChannel(channel)}
                    className={`flex flex-col p-2.5 md:p-3 rounded-xl border cursor-pointer transition-all ${
                      isActive 
                        ? "bg-slate-200 text-black border-slate-400 shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {channel.logo ? (
                          <img 
                            src={channel.logo} 
                            alt={channel.name} 
                            className="w-7 h-7 md:w-8 md:h-8 object-contain bg-white rounded shadow-sm shrink-0"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                            {channel.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-xs md:text-sm truncate text-black">{channel.name}</span>
                      </div>
                      
                      {isMounted && (
                        <button 
                          onClick={(e) => toggleFavorite(e, channel.id)}
                          className={`text-base md:text-lg leading-none transition-colors shrink-0 ${
                            isFavorite ? "text-red-500 hover:text-red-600" : "text-slate-300 hover:text-slate-400"
                          }`}
                        >
                          {isFavorite ? '♥' : '♡'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2.5 pointer-events-none gap-2">
                      <div className="flex gap-1 items-center flex-wrap">
                        <span className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded font-medium ${isActive ? "bg-black text-white" : "bg-slate-100 text-black"}`}>
                          {channel.category}
                        </span>
                        
                        {channel.languages[0] && channel.languages[0] !== "Unknown" && (
                          <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-slate-200 text-black">
                            {channel.languages[0]}
                          </span>
                        )}

                        {channel.subdivision && (
                          <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-slate-300 text-black">
                            📍 {channel.subdivision}
                          </span>
                        )}

                        {channel.quality && (
                          <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded font-bold border border-slate-300 text-black">
                            {channel.quality}
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 shrink-0 text-black">
                        {channel.country !== "GLOBAL" ? (
                          <img src={`https://flagcdn.com/w20/${channel.country.toLowerCase()}.png`} alt={channel.country} className="w-3.5 h-2.5 md:w-4 md:h-3 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)] object-cover" />
                        ) : (
                          <span className="text-xs md:text-sm leading-none">🌐</span>
                        )}
                        {channel.country}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {hasMoreChannels && (
                <div className="py-3 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount((prev) => prev + 100)}
                    className="px-4 md:px-5 py-2 md:py-2.5 text-[11px] md:text-xs font-bold text-black bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all w-full flex justify-center items-center gap-2"
                  >
                    Load More Channels <span className="bg-slate-200 text-black px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-[10px]">{filteredChannels.length - visibleCount} left</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-xs text-slate-400 py-8 font-medium">No channels found</div>
          )}
        </div>
      </aside>

      <main className="order-1 md:order-2 flex-1 w-full md:flex-1 h-[40%] md:h-full flex flex-col overflow-y-auto bg-slate-100 p-3 md:p-8 justify-start items-center">
        <div className="w-full max-w-4xl space-y-4 md:space-y-6">
          {activeChannel ? (
            <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-200/80 space-y-3 md:space-y-4">
              
              <div className="bg-black rounded-lg md:rounded-xl overflow-hidden shadow-inner w-full">
                <VideoPlayer url={activeChannel.streamUrl} />
              </div>

              <div className="flex items-center gap-3 md:gap-4 pt-1">
                {activeChannel.logo && (
                  <img src={activeChannel.logo} alt={activeChannel.name} className="w-10 h-10 md:w-16 md:h-16 object-contain bg-slate-50 border border-slate-100 rounded-lg p-1 shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                )}
                <div>
                  <div className="flex gap-1.5 md:gap-2 items-center flex-wrap">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black bg-slate-100 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md" title={activeChannel.categoryDescription || ""}>
                      {activeChannel.category}
                    </span>
                    <span className="text-[10px] md:text-xs text-black bg-slate-100 px-2 py-0.5 md:py-1 rounded-md font-medium">
                      🗣️ {activeChannel.languages[0]}
                    </span>
                    {activeChannel.subdivision && (
                       <span className="text-[10px] md:text-xs font-bold text-black bg-slate-100 border border-slate-200 px-2 py-0.5 md:py-1 rounded-md">
                         📍 {activeChannel.subdivision}
                       </span>
                    )}
                    {activeChannel.quality && (
                       <span className="text-[10px] md:text-xs font-bold text-white bg-black px-2 py-0.5 md:py-1 rounded-md">
                         {activeChannel.quality}
                       </span>
                    )}
                  </div>
                  
                  <h2 className="text-base md:text-xl font-bold mt-1 md:mt-2 text-black leading-tight">{activeChannel.name}</h2>
                  
                  <div className="text-[11px] md:text-sm text-slate-500 mt-0.5 md:mt-1 font-bold flex items-center gap-1.5 md:gap-2">
                    Country: 
                    {activeChannel.country !== "GLOBAL" ? (
                      <img src={`https://flagcdn.com/w40/${activeChannel.country.toLowerCase()}.png`} alt={activeChannel.country} className="w-4 md:w-5 h-auto rounded-[2px] md:rounded-[3px] shadow-[0_0_3px_rgba(0,0,0,0.2)]" />
                    ) : (
                      <span className="text-sm md:text-lg leading-none">🌐</span>
                    )}
                    {activeChannel.countryName}
                  </div>
                </div>
              </div>
              
              <EpgPanel 
                channelName={activeChannel.name} 
                epgUrl={activeChannel.epgUrl} 
                epgSiteId={activeChannel.epgSiteId} 
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-white rounded-xl md:rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-medium text-xs md:text-base p-4 text-center">
              Please select a channel from the list below to start watching
            </div>
          )}
        </div>
      </main>

    </div>
  );
}