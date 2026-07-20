import { JSDOM } from 'jsdom'
import { createClient } from '@supabase/supabase-js'

/* DB Credentials in GitHub Repo Secrets */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

async function scrapeData(
  weatherDotGovUrl = 'https://forecast.weather.gov/product.php?issuedby=lot&product=omr&site=lot'
) {
  try {
    console.log(`Web Scraping Started: ${weatherDotGovUrl}`);

    /* Fetching HTML content from weather.gov URL */
    const response = await fetch(weatherDotGovUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();

    // Parsing HTML content
    const { window } = new JSDOM(data);
    const doc = window.document;

    // Locate HTML element that contains the data needed
    const element = doc.querySelectorAll('.glossaryProduct');
    console.log('Found element(s):', element.length);
    const elementData = Array.from(element).map((element) => ({
      text: element.textContent?.trim() || ''
    }));

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

    /* Check if patterns exist in the extracted element data */
    const checkingForTempPattern = elementData.find(item => tempPattern.test(item.text));
    const checkingForDateTimePattern = elementData.find(item => dateTimePattern.test(item.text));
    console.log('checkingForTempPattern:', checkingForTempPattern);
    console.log('checkingForDateTimePattern:', checkingForDateTimePattern);

    /* Extract temperature, if found */
    let temperature = null;
    if (checkingForTempPattern) {
      const tempMatch = checkingForTempPattern.text.match(tempPattern);
      temperature = tempMatch[1]; // 1st capture group
      console.log(`Extracted Temperature: ${temperature}F`);
    }

    /* Extract date & time, if found */
    let time, meridiem, timeZone, month, day, year;
    if (checkingForDateTimePattern) {
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

    /* Before insert, all fields contain data or are set to null */
    if (temperature && month && day && year && time && meridiem) {
      /* Convert date & time to ISO format */
      const hours = time.slice(0, -2) || '0';
      const minutes = time.slice(-2);
      const isoDateTime = new Date(`${month} ${day} ${year} ${hours}:${minutes} ${meridiem}`).toISOString();
      /* Insert data into DB */
      const { error } = await supabase.from('lake-mich-temp').insert([{ dateTime: isoDateTime, temp: temperature }]);
      if (error) {
        // Check if it's a duplicate key error
        if (error.message?.includes('duplicate')) {
          console.warn('Duplicate entry detected, skipping insert:', error.message);
        } else {
          console.error('DB Insert Error:', error);
          process.exit(1);
        }
      } else {
        console.log(`Saved to database: ${isoDateTime}, ${temperature}F`);
      }
    } else {
      console.warn('Skipping database insert - missing temperature or date & time fields');
      process.exit(1);
    }

  } catch (error) {
    console.error('Scraping Error:', error);
    process.exit(1);
  }
}

scrapeData();