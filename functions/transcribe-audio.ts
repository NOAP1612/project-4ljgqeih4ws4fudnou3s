import OpenAI from "npm:openai";

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
    console.log('Transcription function called');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { file_url } = body;

    if (!file_url) {
      console.error('No file_url provided');
      return new Response(JSON.stringify({ error: 'No file_url provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log('Fetching file from URL:', file_url);
    
    // Fetch the file from the provided URL
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
        console.error('Failed to fetch file:', fileResponse.status, fileResponse.statusText);
        throw new Error(`Failed to fetch file from URL: ${fileResponse.statusText}`);
    }
    const fileBlob = await fileResponse.blob();
    const originalFilename = file_url.split('/').pop() || 'file.mp4';
    
    console.log('File fetched successfully, size:', fileBlob.size, 'filename:', originalFilename);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
        console.error('OpenAI API key not set');
        return new Response(JSON.stringify({ error: 'OpenAI API key not set' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    console.log('Initializing OpenAI client and sending transcription request...');
    
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const transcription = await openai.audio.transcriptions.create({
        file: new File([fileBlob], originalFilename, { type: fileBlob.type }),
        model: 'whisper-1',
        language: 'he',
        response_format: 'verbose_json',
    });

    console.log('Transcription successful, text length:', transcription.text?.length || 0);

    return new Response(JSON.stringify(transcription), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Function error:', error);
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