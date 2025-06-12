// supabase/functions/generateTavusVideo/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  try {
    const { script, userId } = await req.json();

    if (!script || !userId) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
      });
    }

    const response = await fetch('https://api.tavus.io/video-generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('TAVUS_API_KEY')}`,
      },
      body: JSON.stringify({
        template_id: Deno.env.get('TAVUS_TEMPLATE_ID'),
        script,
        user_id: userId,
      }),
    });

    const result = await response.json();

    if (!result.video_url) {
      return new Response(
        JSON.stringify({ error: 'No video URL returned', raw: result }),
        {
          status: 500,
        }
      );
    }

    return new Response(JSON.stringify({ videoUrl: result.video_url }), {
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Unknown error' }),
      {
        status: 500,
      }
    );
  }
});
