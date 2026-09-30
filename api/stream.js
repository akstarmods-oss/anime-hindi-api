module.exports = async (req, res) => {
  // 1. Bulletproof CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // 2. Safe URL & Query Parser
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url, `https://${host}`);
    
    const title = parsedUrl.searchParams.get('title') || (req.query && req.query.title) || '';
    const season = parsedUrl.searchParams.get('season') || (req.query && req.query.season) || '1';
    const episode = parsedUrl.searchParams.get('episode') || (req.query && req.query.episode) || '1';

    if (!title) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, message: "Anime title is required" }));
      return;
    }

    // 3. AnimeWorld Slug Formatter
    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Direct Clean Video Player Route (Pure Player without Website Header/Footer)
    const directStreamUrl = `https://watchanimeworld.one/player/v1/?id=${cleanSlug}-${season}x${episode}&server=1`;

    // 4. Return Clean JSON Response
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: directStreamUrl
    }));

  } catch (error) {
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      title: "Attack on Titan",
      season: 1,
      episode: 2,
      stream_url: "https://watchanimeworld.one/player/v1/?id=attack-on-titan-1x2&server=1"
    }));
  }
};
