exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Extract the prompt text from the Anthropic-style messages array
    const userMessage = body.messages && body.messages[0] && body.messages[0].content;

    console.log('Audit request received, Gemini key present:', !!process.env.GEMINI_API_KEY);

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.4
          }
        })
      }
    );

    const data = await response.json();

    console.log('Gemini API status:', response.status);
    console.log('Gemini API response:', JSON.stringify(data).slice(0, 500));

    if (!response.ok) {
      throw new Error(data.error ? data.error.message : 'Gemini API request failed');
    }

    // Extract the generated text from Gemini's response shape
    const candidate = data.candidates && data.candidates[0];
    const text = candidate && candidate.content && candidate.content.parts
      ? candidate.content.parts.map(p => p.text || '').join('')
      : '';

    if (!text) {
      throw new Error('Gemini returned no usable content');
    }

    // Reshape into the Anthropic-style {content: [{text: ...}]} shape
    // so the front-end code (auditor/index.html) needs zero changes.
    const reshaped = {
      content: [{ type: 'text', text: text }]
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(reshaped)
    };

  } catch (err) {
    console.error('Audit error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
