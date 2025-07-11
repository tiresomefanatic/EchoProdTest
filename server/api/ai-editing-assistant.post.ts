export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { prompt, currentContent, conversation } = body;

    if (!prompt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: prompt'
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

    // Build conversation history for context
    const conversationHistory: Array<{role: string, content: string}> = conversation || [];
    
    // Prepare the system prompt that makes the AI aware of HTML/TipTap editing
    const systemPrompt = `You are an expert HTML document editor integrated with TipTap editor. You help users edit their documents by modifying HTML content directly.

CRITICAL RULES:
1. You MUST apply the requested changes directly to the document and return the FULL, UPDATED document in your response, on the FIRST attempt.
2. NEVER return only a summary, a diff, or just the changed section—ALWAYS return the COMPLETE document HTML content, never partial content.
3. NEVER use placeholders like "<!-- Rest of content... -->" or similar shortcuts.
4. NEVER just describe the change—ALWAYS make the change in the returned document.
5. ALWAYS include ALL existing content plus your modifications.
6. When adding content, integrate it naturally into the existing document structure.
7. Preserve ALL existing content unless specifically asked to remove it.

IMPORTANT CONTEXT:
- The user's document content is in HTML format from TipTap editor
- You must return the ENTIRE document with your changes applied
- Maintain proper HTML structure and formatting
- Preserve existing styling and structure unless specifically asked to change it
- Be aware that TipTap uses semantic HTML elements

CAPABILITIES:
- Add new sections, paragraphs, headings, lists, etc.
- Modify existing content (text, styling, structure)
- Remove content when specifically requested
- Restructure document sections
- Improve formatting and styling
- Fix HTML structure issues

RESPONSE FORMAT:
When making ANY changes to the document, you MUST:
1. Provide a brief explanation of what changes you made (1-2 sentences)
2. Include the COMPLETE updated HTML content in a code block exactly like this:

\`\`\`html
[COMPLETE FULL HTML CONTENT HERE - NEVER USE PLACEHOLDERS OR SHORTCUTS]
\`\`\`

EXAMPLE:
If user asks to "add a conclusion section", you would:
1. Explain: "I've added a new conclusion section at the end of the document."
2. Provide the ENTIRE document HTML with the new conclusion section added.

Always be helpful and make precise, targeted changes based on the user's instructions.`;

    // Build the messages array for the API call
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Add conversation history
      ...conversationHistory.map((msg: {role: string, content: string}) => ({
        role: msg.role,
        content: msg.content
      })),
      // Add current request with content
      {
        role: 'user',
        content: `Current document content (HTML):
${currentContent || 'No content provided.'}

User instruction: ${prompt}

Please make the requested changes to the document and provide the updated HTML content.`
      }
    ];

    // Debug: Log the input prompt/messages
    console.log('AI Editing Assistant - Input messages:', JSON.stringify(messages, null, 2));

    // Make request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 4000, // Increased from 2000
        temperature: 0.3
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
    const message = data.choices[0]?.message;

    if (!message) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response received from AI'
      });
    }



    // Handle regular text response
    const responseText = message.content?.trim();
    
    // Debug: Log the raw AI response
    console.log('AI Editing Assistant - Raw AI response:', responseText);
    
    if (!responseText) {
      return {
        success: false,
        error: 'No response received from AI',
        response: 'I apologize, but I did not receive a proper response. Please try rephrasing your request.'
      };
    }

    // Try to extract HTML content from the response using more robust patterns
    let htmlMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/i);
    if (!htmlMatch) {
      htmlMatch = responseText.match(/```\s*([\s\S]*?)\s*```/i);
    }
    
    let updatedContent = null;
    let hasChanges = false;

    if (htmlMatch && htmlMatch[1]) {
      updatedContent = htmlMatch[1].trim();
      
      // Debug: Log the extracted HTML content
      console.log('AI Editing Assistant - Extracted HTML:', updatedContent);
      
      // Validate that we have substantial HTML content (not just a placeholder)
      if (updatedContent.length > 50 && 
          !updatedContent.includes('<!-- Rest of content... -->') &&
          !updatedContent.includes('[COMPLETE FULL HTML CONTENT HERE') &&
          !updatedContent.includes('placeholder')) {
        hasChanges = true;
      } else {
        // If the extracted content looks like a placeholder, don't apply it
        updatedContent = null;
        hasChanges = false;
      }
    }

    return {
      success: true,
      response: responseText,
      updatedContent: updatedContent,
      changes: hasChanges ? [{ type: 'modify', description: 'Content updated based on your request', location: 'document' }] : [],
      hasChanges: hasChanges
    };

  } catch (error: any) {
    console.error('AI Editing Assistant Error:', error);
    
    // Return error response
    return {
      success: false,
      error: error.statusMessage || error.message || 'AI editing assistant failed',
      response: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your instruction.'
    };
  }
}); 