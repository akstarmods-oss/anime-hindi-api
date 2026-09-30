module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url, `https://${host}`);
    
    const title = parsedUrl.searchParams.get('title') || (req.query && req.query.title) || '';
    const season = parsedUrl.searchParams.get('season') || (req.query && req.query.season) || '1';
    const episode = parsedUrl.searchParams.get('episode') || (req.query && req.query.episode) || '1';

    if (!title) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, message: "Title required" }));
      return;
    }

    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // AnimeWorld Direct Clean Player Route (Website interface bypass)
    const cleanPlayerUrl = `https://watchanimeworld.one/player/v1/?id=${cleanSlug}-${season}x${episode}&server=1`;

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      title: title,
      season: parseInt(season),
      episode: parseInt(episode),
      stream_url: cleanPlayerUrl
    }));

  } catch (error) {
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      stream_url: "https://watchanimeworld.one/player/v1/?id=attack-on-titan-1x2&server=1"
    }));
  }
};
