Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    console.log('Simplified transcription function called');
    const body = await req.json();
    console.log('Request body received:', body);

    // Return a mock success response for debugging
    const mockResponse = {
      text: "זוהי תגובת בדיקה מהשרת.",
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 5,
          text: "זוהי תגובת בדיקה מהשרת.",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 0,
          no_speech_prob: 0,
        }
      ],
      language: "he"
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Simplified function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      type: 'transcription_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});