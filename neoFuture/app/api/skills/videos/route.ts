import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TOPICS = [
  'farm', 'farming', 'farmer', 'agriculture', 'agricultural',
  'crop', 'crops', 'harvest', 'harvesting', 'seed', 'seeds', 'sowing',
  'irrigation', 'drip irrigation', 'sprinkler', 'water management',
  'pesticide', 'pest', 'pest control', 'insecticide', 'fungicide', 'herbicide',
  'fertilizer', 'fertiliser', 'manure', 'compost', 'organic',
  'soil', 'soil health', 'soil testing', 'mulching',
  'plant', 'plant health', 'plant disease', 'plant growth',
  'vegetable', 'fruit', 'wheat', 'rice', 'paddy', 'maize', 'corn',
  'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'soybean',
  'horticulture', 'greenhouse', 'polyhouse', 'nursery',
  'dairy', 'animal husbandry', 'poultry', 'goat', 'cattle',
  'agri', 'agro', 'kisan', 'kheti', 'fasal',
];

function isAgricultureTopic(query: string): boolean {
  const q = query.toLowerCase().trim();
  return ALLOWED_TOPICS.some((topic) => q.includes(topic) || topic.includes(q));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Block non-agriculture searches
  if (!isAgricultureTopic(query)) {
    return NextResponse.json({ videos: [], query, filtered: true });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env.local file.' },
      { status: 503 }
    );
  }

  try {
    // YouTube only accepts one videoDuration value at a time,
    // so fire both medium (4–20 min) and long (20+ min) in parallel
    const buildParams = (duration: 'medium' | 'long') =>
      new URLSearchParams({
        part: 'snippet',
        q: `${query} farming India tutorial`,
        type: 'video',
        maxResults: '10',
        regionCode: 'IN',
        relevanceLanguage: 'en',
        videoEmbeddable: 'true',
        videoDuration: duration,
        safeSearch: 'strict',
        key: apiKey,
      });

    const [medRes, longRes] = await Promise.all([
      fetch(`https://www.googleapis.com/youtube/v3/search?${buildParams('medium')}`, { next: { revalidate: 3600 } }),
      fetch(`https://www.googleapis.com/youtube/v3/search?${buildParams('long')}`,   { next: { revalidate: 3600 } }),
    ]);

    // If both fail, surface the error
    if (!medRes.ok && !longRes.ok) {
      const err = await medRes.json().catch(() => ({}));
      console.error('YouTube API error:', err);
      if (medRes.status === 403) {
        return NextResponse.json(
          { error: 'YouTube API quota exceeded. Please try again tomorrow or add a new API key.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: 'Failed to fetch videos from YouTube.' }, { status: 500 });
    }

    const [medData, longData] = await Promise.all([
      medRes.ok  ? medRes.json()  : Promise.resolve({ items: [] }),
      longRes.ok ? longRes.json() : Promise.resolve({ items: [] }),
    ]);

    // Merge, deduplicate by videoId
    const seen = new Set<string>();
    const items: any[] = [];
    for (const item of [...(medData.items || []), ...(longData.items || [])]) {
      const id = item.id?.videoId;
      if (id && !seen.has(id)) { seen.add(id); items.push(item); }
    }

    // Fetch durations to hard-confirm nothing under 3 min slipped through
    const videoIds = items.map((i: any) => i.id?.videoId).filter(Boolean).join(',');
    let durationMap: Record<string, string> = {};
    if (videoIds) {
      const detailsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
      );
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        for (const item of detailsData.items || []) {
          durationMap[item.id] = item.contentDetails?.duration || '';
        }
      }
    }

    function parseDuration(iso: string): number {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      return (parseInt(match[1] || '0') * 3600) +
             (parseInt(match[2] || '0') * 60) +
             parseInt(match[3] || '0');
    }

    const videos = items
      .map((item: any) => {
        const videoId = item.id?.videoId;
        const snippet = item.snippet || {};
        return {
          id: videoId,
          videoId,
          title: snippet.title,
          channel: snippet.channelTitle,
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          publishedAt: snippet.publishedAt,
          durationSecs: parseDuration(durationMap[videoId] || ''),
        };
      })
      .filter((v: any) => v.videoId && v.durationSecs >= 180) // hard-drop anything under 3 min
      .slice(0, 15);

    return NextResponse.json({ videos, query, count: videos.length });

  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos.' }, { status: 500 });
  }
}
