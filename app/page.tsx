import { getIptvOrgChannels, getFreeTvChannels } from './lib/iptv';
import Dashboard from './components/Dashboard';

export default async function Home() {
  const [iptvOrgData, freeTvData] = await Promise.all([
    getIptvOrgChannels(),
    getFreeTvChannels()
  ]);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-100 text-black">
      <Dashboard 
        iptvOrgChannels={iptvOrgData} 
        freeTvChannels={freeTvData} 
      />
    </main>
  );
}