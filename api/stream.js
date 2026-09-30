const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(headers).end();
  }

  const { title, season = 1, episode = 1 } = req.query;

  if (!title) {
    return res.status(400).json({ success: false, message: "Anime title is required" });
  }

  try {
    // 1. Title ko clean slug me convert karein (e.g. "Attack on Titan" -> "attack-on-titan")
    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // 2. AnimeWorld ka direct episode URL banayein
    const targetPageUrl = `https://watchanimeworld.one/episode/${cleanSlug}-${season}x${episode}/`;

    // 3. AnimeWorld page fetch karke player iframe extract karein
    const response = await axios.get(targetPageUrl, {
      headers: {
        'User-Agent': headers['User-Agent'],
        'Referer': 'https://watchanimeworld.one/'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    
    // Player iframe ka direct source (Abyss / Multicloud stream)
    let streamUrl = $('iframe').attr('src') || $('iframe#player').attr('src') \vert{}\vert{} $('.player-embed iframe').attr('src');

    if (streamUrl && streamUrl.startsWith('//')) {
      streamUrl = 'https:' + streamUrl;
    }

    // Agar iframe na mile toh direct episode page ko fallback banayein
    if (!streamUrl) {
      streamUrl = targetPageUrl;
    }

    return res.status(200).set(headers).json({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: streamUrl,
      source: "watchanimeworld"
    });

  } catch (error) {
    // Fallback URL agar slug match na ho
    const fallbackUrl = `https://watchanimeworld.one/episode/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${season}x${episode}/`;

    return res.status(200).set(headers).json({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: fallbackUrl,
      note: "Fallback to direct page"
    });
  }
};
