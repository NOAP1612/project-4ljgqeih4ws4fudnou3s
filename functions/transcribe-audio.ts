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
    const { file_url } = await req.json();

    if (!file_url) {
      return new Response(JSON.stringify({ error: 'No file_url provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Fetch the file from the provided URL
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from URL: ${fileResponse.statusText}`);
    }
    const fileBlob = await fileResponse.blob();
    const originalFilename = file_url.split('/').pop() || 'file';


    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
        return new Response(JSON.stringify({ error: 'OpenAI API key not set' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', fileBlob, originalFilename);
    transcriptionFormData.append('model', 'whisper-1');
    transcriptionFormData.append('language', 'he');
    transcriptionFormData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: transcriptionFormData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        return new Response(JSON.stringify({ error: 'Failed to transcribe audio', details: errorData }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    const data = await response.json();

    return new Response(JSON.stringify({ transcription: data.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});