"use client";

import { useEffect, useState } from "react";

interface EpgProgram {
  title: string;
  start: Date;
  stop: Date;
  desc: string | null;
}

interface EpgPanelProps {
  channelName: string;
  epgUrl: string | null;
  epgSiteId: string | null;
}

export default function EpgPanel({ channelName, epgUrl, epgSiteId }: EpgPanelProps) {
  const [programs, setPrograms] = useState<EpgProgram[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseXmltvDate = (dateStr: string | null) => {
    if (!dateStr) return new Date();
    const isoStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}${dateStr.slice(15, 16) || '+'}${dateStr.slice(16, 18) || '00'}:${dateStr.slice(18, 20) || '00'}`;
    return new Date(isoStr);
  };

  useEffect(() => {
    if (!epgUrl || !epgSiteId) {
      setPrograms([]);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(epgUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat jadwal dari server");
        return response.text();
      })
      .then((xmlText) => {
        if (!isMounted) return;
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const programmeNodes = xmlDoc.querySelectorAll(`programme[channel="${epgSiteId}"]`);
        const extractedPrograms: EpgProgram[] = [];
        const now = new Date();

        programmeNodes.forEach((node) => {
          const start = parseXmltvDate(node.getAttribute("start"));
          const stop = parseXmltvDate(node.getAttribute("stop"));
          const title = node.querySelector("title")?.textContent || "No Title";
          const desc = node.querySelector("desc")?.textContent || null;

          if (stop > new Date(now.getTime() - 2 * 60 * 60 * 1000)) { 
            extractedPrograms.push({ title, start, stop, desc });
          }
        });

        extractedPrograms.sort((a, b) => a.start.getTime() - b.start.getTime());
        setPrograms(extractedPrograms.slice(0, 15)); 
        setIsLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("EPG Parse Error:", err);
          setError("Jadwal siaran sedang tidak tersedia saat ini.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [epgUrl, epgSiteId]);

  if (!epgUrl) {
    return (
      <div className="mt-6 pt-4 text-black">
        <h3 className="text-lg font-bold">Schedule</h3>
        <p className="text-sm mt-2">Jadwal resmi untuk saluran ini belum tersedia di pusat data EPG.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 text-black">
      <h3 className="text-lg font-bold mb-4">TV Guide: {channelName}</h3>
      
      {isLoading && <div className="text-sm">Memuat jadwal tayangan...</div>}
      
      {error && !isLoading && <div className="text-sm">{error}</div>}

      {!isLoading && !error && programs.length === 0 && (
        <div className="text-sm">Tidak ada jadwal tayangan yang ditemukan untuk waktu ini.</div>
      )}

      {!isLoading && programs.length > 0 && (
        <div className="flex flex-col gap-3">
          {programs.map((prog, i) => {
            const isLive = new Date() >= prog.start && new Date() <= prog.stop;
            const startTime = prog.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={i} className="flex gap-4">
                <div className="w-16 shrink-0 pt-0.5">
                  <span className="text-sm font-bold block">{startTime}</span>
                  {isLive && <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1 block">Live</span>}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">{prog.title}</h4>
                  {prog.desc && <p className="text-xs mt-1">{prog.desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}