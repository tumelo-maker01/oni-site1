exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, tags } = JSON.parse(event.body);

    const KIT_API_KEY = process.env.KIT_API_KEY;
    const KIT_FORM_ID = process.env.KIT_FORM_ID;

    // Subscribe to Kit form
    const res = await fetch(`https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email: email,
        tags: tags || []
      })
    });

    const data = await res.json();

    if (data.subscription) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, subscriber: data.subscription })
      };
    } else {
      throw new Error('Kit subscription failed');
    }

  } catch(err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
