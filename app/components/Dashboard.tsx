"use client";

import { useState, useMemo } from "react";
import VideoPlayer from "./VideoPlayer";
import { TVChannel } from ".././lib/iptv";

const FILTER_PRESETS = [
  { label: "All Channels", value: "All" },
  { label: "Indonesia Only", value: "Indonesia" },
  { label: "Sports Channels", value: "Sports" },
  { label: "Kids Channels", value: "Kids" }
];

interface DashboardProps {
  initialChannels: TVChannel[];
}

export default function Dashboard({ initialChannels }: DashboardProps) {
  const [activeChannel, setActiveChannel] = useState<TVChannel | null>(
    initialChannels.length > 0 ? initialChannels[0] : null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPreset, setSelectedPreset] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialChannels.forEach((channel) => {
      if (channel.category) set.add(channel.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [initialChannels]);

  const filteredChannels = useMemo(() => {
    return initialChannels.filter((channel) => {
      if (channel.name.toUpperCase().startsWith("[DANA KHUSUS]")) {
        return false;
      }

      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || channel.category === selectedCategory;

      let matchesPreset = true;
      if (selectedPreset === "Indonesia") {
        matchesPreset = channel.country === "ID"; 
      } else if (selectedPreset === "Sports") {
        matchesPreset = channel.category.toLowerCase() === "sports";
      } else if (selectedPreset === "Kids") {
        matchesPreset = channel.category.toLowerCase() === "kids";
      }

      return matchesSearch && matchesCategory && matchesPreset;
    });
  }, [initialChannels, searchQuery, selectedCategory, selectedPreset]);

  const displayChannels = filteredChannels.slice(0, 100);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      
      <aside className="w-85 bg-white border-r border-slate-200 flex flex-col h-full min-w-[21rem]">
        <div className="p-5 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-indigo">
              IPTV Player Pro
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Showing {filteredChannels.length} Channels
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Filter</label>
            <select
              value={selectedPreset}
              onChange={(e) => {
                setSelectedPreset(e.target.value);
                setSelectedCategory("All"); 
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-indigo transition-all cursor-pointer"
            >
              {FILTER_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {categories.map((category) => {
              const isCatActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                    isCatActive ? "bg-brand-violet text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-slate-50">
          {displayChannels.length > 0 ? (
            displayChannels.map((channel) => {
              const isActive = activeChannel?.id === channel.id;
              return (
                <div 
                  key={channel.id} 
                  onClick={() => setActiveChannel(channel)}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? "bg-brand-indigo text-white border-brand-indigo shadow-md shadow-indigo-100" 
                      : "bg-white border-slate-200 hover:border-brand-indigo hover:bg-indigo-50/10"
                  }`}
                >
                  <span className="font-semibold text-sm truncate">{channel.name}</span>
                  <div className="flex justify-between items-center mt-2 pointer-events-none">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {channel.category}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                      {channel.country}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-xs text-slate-400 py-8 font-medium">No channels found</div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100 p-8 justify-start items-center">
        <div className="w-full max-w-4xl space-y-6">
          {activeChannel ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo bg-indigo-50 px-2.5 py-1 rounded-md">
                  {activeChannel.category}
                </span>
                <h2 className="text-xl font-bold mt-2 text-slate-900">{activeChannel.name}</h2>
                <p className="text-sm text-slate-400 mt-0.5 font-bold">Country: {activeChannel.country}</p>
              </div>
              <div className="bg-black rounded-xl overflow-hidden shadow-inner">
                <VideoPlayer url={activeChannel.streamUrl} />
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-white rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-medium">
              Please select a channel from the sidebar to start watching
            </div>
          )}
        </div>
      </main>

    </div>
  );
}