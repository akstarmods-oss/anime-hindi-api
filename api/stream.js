const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Standard Vercel CORS Headers (No crash)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { title, season = 1, episode = 1 } = req.query;

  if (!title) {
    return res.status(400).json({ success: false, message: "Anime title is required" });
  }

  try {
    // 1. Title slug banayein (e.g., "Attack on Titan" -> "attack-on-titan")
    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const targetUrl = `https://watchanimeworld.one/episode/${cleanSlug}-${season}x${episode}/`;

    let streamUrl = null;

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://watchanimeworld.one/'
        },
        timeout: 6000
      });

      const $ = cheerio.load(response.data);
      streamUrl = $('iframe').attr('src') || $('iframe#player').attr('src') \vert{}\vert{} $('.player-embed iframe').attr('src');

      if (streamUrl && streamUrl.startsWith('//')) {
        streamUrl = 'https:' + streamUrl;
      }
    } catch (scrapeErr) {
      // Scrape timeout / protection fallback
    }

    // Agar direct iframe nahi mila toh direct player page provide karein
    if (!streamUrl) {
      streamUrl = targetUrl;
    }

    return res.status(200).json({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: streamUrl
    });

  } catch (err) {
    return res.status(200).json({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: `https://watchanimeworld.one/episode/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${season}x${episode}/`
    });
  }
};
