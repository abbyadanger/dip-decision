// scrape.js - Browser-compatible scraping utilities

export async function scrapeData(
  weatherDotGovUrl = 'https://forecast.weather.gov/product.php?issuedby=lot&product=omr&site=lot'
) {
  try {
    console.log(`🏁 Web Scraping Started: ${weatherDotGovUrl}`);
    
    // Use CORS proxy to bypass CORS restrictions
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(weatherDotGovUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`🚨 HTTP error! status: ${response.status}`);
    }
    const data = await response.text(); // corsproxy.io returns HTML directly as string
    
    // Parse HTML using DOMParser (browser API)
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    
    // Find the element on the web page that contains the data needed
    const element = doc.querySelectorAll('.glossaryProduct'); // (e.g. the "glossaryProduct" element)
    console.log('✅ Found element(s):', element);
    const elementData = Array.from(element).map((element, index) => ({
      text: element.textContent?.trim() || ''
    }));
    console.log('📋 Extracted element data:', elementData);
    
    /**
     * Pattern to find Chicago Shore + Temperature (e.g. "Chicago Shore...........53")
     * This regex contains 2 capture groups:
      * 1. "Chicago Shore" followed by any characters (the dots) = /Chicago Shore\.
      * 2. The temperature (2 digits) = (\d{2})/
     **/
    const chicagoShorePattern = /Chicago Shore\.+(\d{2})/;

    const datePattern = /\w{3} \w{3} \d{1,2} \d{4}/;
    
    // See if pattern exists in the element data
    const chicagoShoreEntry = elementData.find(item => {
      return chicagoShorePattern.test(item.text);
    });

    const dateEntry = elementData.find(item => {
      return datePattern.test(item.text);
    });

    // If the pattern is found - Return the temperature
    if (chicagoShoreEntry) {
      console.log('✅ Pattern Found in Chicago Shore entry:', chicagoShoreEntry);
      const regExMatchArray = chicagoShoreEntry.text.match(chicagoShorePattern);
      const temperature = regExMatchArray[1]; // The first capture group
      console.log(`🌡️ Extracted Temperature: ${temperature}°F`);
      return temperature;
    }
    
  } catch (error) {
    console.error('🚨 Scraping Error:', error);
  }
}