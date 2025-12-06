// Test Groq AI API with llama-3.3-70b-versatile
// Run: node test-groq.js

// Your Groq API Key (from .env.local)
const GROQ_API_KEY = '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';

async function testGroq() {
  console.log('🚀 Testing Groq AI API with llama-3.3-70b-versatile...\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: 'Give me lyrics of a song'
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', response.status);
      console.error('Details:', error);
      return;
    }

    const data = await response.json();

    console.log('✅ Success! Groq AI Response:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Model:', data.model);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(data.choices[0].message.content);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Token Usage:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Prompt tokens:     ', data.usage.prompt_tokens);
    console.log('  Completion tokens: ', data.usage.completion_tokens);
    console.log('  Total tokens:      ', data.usage.total_tokens);

    // Check response headers for rate limit info
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining-tokens');
    const rateLimitLimit = response.headers.get('x-ratelimit-limit-tokens');
    const rateLimitReset = response.headers.get('x-ratelimit-reset-tokens');

    console.log('\n🔥 Rate Limit Info:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (rateLimitLimit) {
      console.log('  Total limit:       ', rateLimitLimit, 'tokens');
      console.log('  Remaining:         ', rateLimitRemaining || 'N/A', 'tokens');

      if (rateLimitRemaining && rateLimitLimit) {
        const used = parseInt(rateLimitLimit) - parseInt(rateLimitRemaining);
        const percentUsed = ((used / parseInt(rateLimitLimit)) * 100).toFixed(2);
        console.log('  Used:              ', used, 'tokens (' + percentUsed + '%)');
      }
    } else {
      console.log('  Rate limit info not available in headers');
    }

    if (rateLimitReset) {
      console.log('  Resets in:         ', rateLimitReset);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGroq();
