import { createClient } from '@supabase/supabase-js'

// DB Credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export async function scrapeData(
  weatherDotGovUrl = 'https://forecast.weather.gov/product.php?issuedby=lot&product=omr&site=lot'
) {
  try {
    console.log(`Web Scraping Started: ${weatherDotGovUrl}`);
    
    // Use CORS proxy to bypass CORS restrictions
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(weatherDotGovUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text(); // corsproxy.io returns HTML directly as string
    
    // Parse HTML using DOMParser (browser API)
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    
    // Find the element on the web page that contains the data needed
    const element = doc.querySelectorAll('.glossaryProduct'); // (e.g. the "glossaryProduct" element)
    console.log('Found element(s):', element);
    const elementData = Array.from(element).map((element) => ({
      text: element.textContent?.trim() || ''
    }));
    console.log('Extracted element data:', elementData);
    
    /**
     * Pattern to find Chicago Shore + Temperature (e.g. "Chicago Shore...........53")
     * This regex contains 2 capture groups:
      * 1. "Chicago Shore" followed by any characters (the dots) = /Chicago Shore\.
      * 2. The temperature (2 digits) = (\d{2})/
     **/
    const tempPattern = /Chicago Shore\.+(\d{2})/;

    /**
     * Pattern to find the time and date (e.g. "921 AM CDT Jul 17 2026")
     * This regex contains 6 capture groups:
     * 1. Time (1 to 4 digits) = (\d{1,4})
     * 2. Meridiem (AM/PM) = (AM|PM)
     * 3. Time zone (e.g. CDT) = (\w+)
     * 4. Month (e.g. Jul) = (\w+)
     * 5. Day (1 or 2 digits) = (\d{1,2})
     * 6. Year (4 digits) = (\d{4})
     */
    const dateTimePattern = /(\d{1,4}) (AM|PM) (\w+) \w+ (\w+) (\d{1,2}) (\d{4})/;
    
    // See if patterns exists in the element data
    const checkingForTempPattern = elementData.find(item => {
      return tempPattern.test(item.text);
    });
    console.log('checkingForTempPattern:', checkingForTempPattern);
    const checkingForDateTimePattern = elementData.find(item => {
      return dateTimePattern.test(item.text);
    });
    console.log('checkingForDateTimePattern:', checkingForDateTimePattern);

    // Extract temperature if pattern found
    let temperature = null;
    if (checkingForTempPattern) {
      console.log('Pattern Found in Chicago Shore entry:', checkingForTempPattern);
      const tempMatch = checkingForTempPattern.text.match(tempPattern);
      temperature = tempMatch[1]; // 1st capture group
      console.log(`Extracted Temperature: ${temperature}°F`);
    }

    // Extract date/time if pattern found
    let time, meridiem, timeZone, month, day, year;
    if (checkingForDateTimePattern) {
      console.log('Pattern Found for time and date entry:', checkingForDateTimePattern);
      const dateMatch = checkingForDateTimePattern.text.match(dateTimePattern);
      time = dateMatch[1]; // 1st capture group
      meridiem = dateMatch[2]; // 2nd capture group
      timeZone = dateMatch[3]; // 3rd capture group
      month = dateMatch[4]; // 4th capture group
      day = dateMatch[5]; // 5th capture group
      year = dateMatch[6]; // 6th capture group
      console.log(`Extracted Time: ${time} ${meridiem} ${timeZone}`);
      console.log(`Extracted Date: ${month} ${day}, ${year}`);
    }

    // All fields contain data or are set to null
    if (temperature && month && day && year && time && meridiem) {
      // Convert time to 24-hour format for ISO string
      const hours = time.slice(0, -2) || '0';
      const minutes = time.slice(-2);
      const isoDateTime = new Date(`${month} ${day} ${year} ${hours}:${minutes} ${meridiem}`).toISOString();
      // Insert data into DB
      const { error } = await supabase.from('lake-mich-temp').insert([{ dateTime: isoDateTime, temp: temperature }]);
      if (error) {
        console.error('DB Insert Error:', error);
      } else {
        console.log(`Saved to database: ${isoDateTime}, ${temperature}°F`);
      }
    } else {
      console.warn('Skipping database insert — missing temperature or date fields');
    }

    return { temperature, time, meridiem, timeZone, month, day, year };
    
  } catch (error) {
    console.error('Scraping Error:', error);
  }
}