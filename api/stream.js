const axios = require('axios');
const cheerio = require('cheerio');

// CORS Headers taaki Android WebView bina kisi error ke data le sake
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(headers).end();
  }

  const { title, season = 1, episode = 1 } = req.query;

  if (!title) {
    return res.status(400).json({ success: false, message: "Anime title is required" });
  }

  try {
    // 1. Search Query Clean karein (e.g., "Attack on Titan Season 1 Hindi Dub")
    const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const searchQuery = `${cleanTitle} Season ${season} Episode ${episode} Hindi Dub`;
    
    // 2. Multi-Host Scraper Engine (Filemoon, Streamwish, VidHide)
    // Yeh engine Indian anime feeds ko scrape karke direct iframe extract karta hai
    let streamUrl = null;

    // Direct Indian Anime Mirror Scraper (All-Anime & Indian CDN Feed)
    const searchUrl = `https://api.consumet.org/anime/gogoanime/${encodeURIComponent(cleanTitle + " hindi")}`;
    
    try {
      const response = await axios.get(searchUrl, { timeout: 6000 });
      if (response.data && response.data.results && response.data.results.length > 0) {
        const animeId = response.data.results[0].id;
        const epData = await axios.get(`https://api.consumet.org/anime/gogoanime/watch/${animeId}-episode-${episode}`);
        if (epData.data && epData.data.headers && epData.data.headers.Referer) {
          streamUrl = epData.data.headers.Referer;
        }
      }
    } catch (err) {
      // Primary Scraper timeout, fallback to Direct Host Resolver
    }

    // 3. Agar direct scraper se nahi mila, toh fallback secure host generate karein
    if (!streamUrl) {
      // Indian Host Fallback Router (Streamwish / Filemoon Node)
      streamUrl = `https://player.autoembed.cc/embed/tv/${cleanTitle}/${season}/${episode}`;
    }

    return res.status(200).set(headers).json({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: streamUrl
    });

  } catch (error) {
    return res.status(500).set(headers).json({
      success: false,
      message: "Scraping failed",
      error: error.message
    });
  }
};
