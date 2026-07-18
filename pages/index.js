import { scrapeData } from '../services/scrape'
import { useState } from 'react'

export default function Home() {
  const [data, setData] = useState(''); // Changed from [] to ''
  const [loading, setLoading] = useState(false);

  const triggerScape = async () => {
    setLoading(true);
    try {
      console.log('Starting browser-based scraping...');
      const scrapedData = await scrapeData();
      setData(scrapedData);
      console.log('Scraping completed successfully!');
    } catch (error) {
      console.error('Scraping failed:', error);
      alert('Scraping failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={triggerScape}>
        Scrape
      </button>
    </div>
  )
}