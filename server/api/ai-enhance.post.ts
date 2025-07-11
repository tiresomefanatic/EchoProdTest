export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { prompt, selectedText, actionType } = body;

    if (!prompt || !selectedText) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: prompt and selectedText'
      });
    }

    // Get OpenAI API key from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OpenAI API key not configured'
      });
    }

    // Prepare the request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional writing assistant. Follow the instructions precisely and provide only the enhanced text without explanations or additional comments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => null);
      throw createError({
        statusCode: openaiResponse.status,
        statusMessage: `OpenAI API error: ${errorData?.error?.message || 'Unknown error'}`
      });
    }

    const data = await openaiResponse.json();
    const enhancedText = data.choices[0]?.message?.content?.trim();

    if (!enhancedText) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response received from AI'
      });
    }

    return {
      success: true,
      enhancedText,
      actionType,
      originalText: selectedText
    };

  } catch (error: any) {
    console.error('AI Enhancement Error:', error);
    
    // Return a fallback response instead of throwing
    return {
      success: false,
      error: error.statusMessage || error.message || 'AI enhancement failed',
      fallback: true
    };
  }
}); 