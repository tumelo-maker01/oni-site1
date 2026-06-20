exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);

    const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
    const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

    console.log('Subscribe attempt for:', email);
    console.log('API key present:', !!MAILERLITE_API_KEY, 'length:', MAILERLITE_API_KEY ? MAILERLITE_API_KEY.length : 0);
    console.log('Group ID:', MAILERLITE_GROUP_ID);

    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: email,
        groups: [MAILERLITE_GROUP_ID]
      })
    });

    const data = await res.json();

    console.log('MailerLite response status:', res.status);
    console.log('MailerLite response body:', JSON.stringify(data));

    if (res.ok && data.data) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, subscriber: data.data })
      };
    } else {
      throw new Error(data.message || JSON.stringify(data) || 'MailerLite subscription failed');
    }

  } catch(err) {
    console.error('Subscribe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
