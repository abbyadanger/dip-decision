// scrape-node.js - Node.js compatible scraper for GitHub Actions
// Uses jsdom instead of browser DOMParser. No CORS proxy needed server-side.
import { JSDOM } from 'jsdom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

async function scrapeData(
  weatherDotGovUrl = 'https://forecast.weather.gov/product.php?issuedby=lot&product=omr&site=lot'
) {
  try {
    console.log(`Web Scraping Started: ${weatherDotGovUrl}`);

    const response = await fetch(weatherDotGovUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();

    // Parse HTML using jsdom (Node.js equivalent of DOMParser)
    const { window } = new JSDOM(data);
    const doc = window.document;

    const element = doc.querySelectorAll('.glossaryProduct');
    console.log('Found element(s):', element.length);
    const elementData = Array.from(element).map((element) => ({
      text: element.textContent?.trim() || ''
    }));

    const tempPattern = /Chicago Shore\.+(\d{2})/;
    const dateTimePattern = /(\d{1,4}) (AM|PM) (\w+) \w+ (\w+) (\d{1,2}) (\d{4})/;

    const checkingForTempPattern = elementData.find(item => tempPattern.test(item.text));
    const checkingForDateTimePattern = elementData.find(item => dateTimePattern.test(item.text));

    console.log('checkingForTempPattern:', checkingForTempPattern);
    console.log('checkingForDateTimePattern:', checkingForDateTimePattern);

    let temperature = null;
    if (checkingForTempPattern) {
      const tempMatch = checkingForTempPattern.text.match(tempPattern);
      temperature = tempMatch[1];
      console.log(`Extracted Temperature: ${temperature}F`);
    }

    let time, meridiem, timeZone, month, day, year;
    if (checkingForDateTimePattern) {
      const dateMatch = checkingForDateTimePattern.text.match(dateTimePattern);
      time = dateMatch[1];
      meridiem = dateMatch[2];
      timeZone = dateMatch[3];
      month = dateMatch[4];
      day = dateMatch[5];
      year = dateMatch[6];
      console.log(`Extracted Time: ${time} ${meridiem} ${timeZone}`);
      console.log(`Extracted Date: ${month} ${day}, ${year}`);
    }

    if (temperature && month && day && year && time && meridiem) {
      const hours = time.slice(0, -2) || '0';
      const minutes = time.slice(-2);
      const isoDateTime = new Date(`${month} ${day} ${year} ${hours}:${minutes} ${meridiem}`).toISOString();
      const { error } = await supabase.from('lake-mich-temp').insert([{ dateTime: isoDateTime, temp: temperature }]);
      if (error) {
        console.error('DB Insert Error:', error);
        process.exit(1);
      } else {
        console.log(`Saved to database: ${isoDateTime}, ${temperature}F`);
      }
    } else {
      console.warn('Skipping database insert - missing temperature or date fields');
      process.exit(1);
    }

  } catch (error) {
    console.error('Scraping Error:', error);
    process.exit(1);
  }
}

scrapeData();
