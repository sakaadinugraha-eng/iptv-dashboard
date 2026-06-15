import { getChannels } from './lib/iptv';
import Dashboard from './components/Dashboard';

export default async function Home() {
  const channels = await getChannels();

  return <Dashboard initialChannels={channels} />;
}