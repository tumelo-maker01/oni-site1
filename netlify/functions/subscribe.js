exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, source } = JSON.parse(event.body);

    const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;

    // Route to the correct MailerLite group depending on which flow triggered this.
    // 'newsletter' (default) = main ONI Insider signup
    // 'auditor_paid'         = successful R199 auditor payment
    // 'auditor_abandoned'    = entered email, opened Paystack, did not complete payment
    let groupId;
    if (source === 'auditor_paid') {
      groupId = process.env.MAILERLITE_GROUP_ID_AUDITOR_PAID;
    } else if (source === 'auditor_abandoned') {
      groupId = process.env.MAILERLITE_GROUP_ID_AUDITOR_ABANDONED;
    } else {
      groupId = process.env.MAILERLITE_GROUP_ID;
    }

    console.log('Subscribe attempt for:', email, 'source:', source || 'newsletter', 'groupId:', groupId);

    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: email,
        groups: [groupId]
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
