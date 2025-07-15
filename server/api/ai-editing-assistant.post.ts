import { readMultipartFormData } from 'h3';

// Helper function to convert file to base64
const fileToBase64 = (buffer: Buffer): string => {
  return buffer.toString('base64');
};

// Helper function to extract text from different file types
const extractTextFromFile = async (fileName: string, fileBuffer: Buffer, mimeType: string): Promise<string> => {
  try {
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return fileBuffer.toString('utf-8');
    }
    
    if (mimeType === 'application/pdf') {
      try {
        // Dynamic import to avoid loading pdf-parse at startup
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text || `[PDF Document: ${fileName} - No text content found]`;
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        return `[PDF Document: ${fileName} - Error extracting text: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}]`;
      }
    }
    
    if (mimeType.includes('word') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        // Dynamic import to avoid loading mammoth at startup
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return result.value || `[Word Document: ${fileName} - No text content found]`;
      } catch (wordError) {
        console.error('Error parsing Word document:', wordError);
        return `[Word Document: ${fileName} - Error extracting text: ${wordError instanceof Error ? wordError.message : 'Unknown error'}]`;
      }
    }
    
    // For unsupported document types, try to read as text anyway
    try {
      const textContent = fileBuffer.toString('utf-8');
      if (textContent.length > 0) {
        return textContent;
      }
    } catch (textError) {
      // Failed to read as text
    }
    
    return `[Document: ${fileName} - Content type: ${mimeType} - Text extraction not supported]`;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `[Error reading document: ${fileName} - ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
};

// Helper function to check if file is an image
const isImageFile = (mimeType: string): boolean => {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
};

export default defineEventHandler(async (event) => {
  try {
    // Check if request is multipart (has file attachments)
    const contentType = getHeader(event, 'content-type') || '';
    let body: any;
    let attachedFiles: Array<{name: string, content: string | Buffer, mimeType: string}> = [];

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data with files
      const formData = await readMultipartFormData(event);
      
      if (!formData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'No form data received'
        });
      }

      // Extract text fields
      const promptPart = formData.find(part => part.name === 'prompt');
      const contentPart = formData.find(part => part.name === 'currentContent');
      const conversationPart = formData.find(part => part.name === 'conversation');

      body = {
        prompt: promptPart ? new TextDecoder().decode(promptPart.data) : '',
        currentContent: contentPart ? new TextDecoder().decode(contentPart.data) : '',
        conversation: conversationPart ? JSON.parse(new TextDecoder().decode(conversationPart.data)) : []
      };

      // Extract files
      const fileParts = formData.filter(part => part.name?.startsWith('file_'));
      
      for (const filePart of fileParts) {
        if (filePart.data && filePart.filename) {
          attachedFiles.push({
            name: filePart.filename,
            content: filePart.data,
            mimeType: filePart.type || 'application/octet-stream'
          });
        }
      }
    } else {
      // Handle regular JSON request (backward compatibility)
      body = await readBody(event);
    }

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
    
    // Process attached files
    let fileContexts: string[] = [];

    for (const file of attachedFiles) {
      console.log(`Processing file: ${file.name}, type: ${file.mimeType}`);
      
      if (isImageFile(file.mimeType)) {
        // Images will be processed directly in message creation
        fileContexts.push(`Image: ${file.name} (${file.mimeType})`);
      } else {
        // Handle documents - extract text content
        const textContent = await extractTextFromFile(file.name, file.content as Buffer, file.mimeType);
        fileContexts.push(`Document: ${file.name}\nContent:\n${textContent}\n---`);
      }
    }

    // Prepare the system prompt that makes the AI aware of HTML/TipTap editing and file context
    const systemPrompt = `You are an expert HTML document editor integrated with TipTap editor. You help users edit their documents by modifying HTML content directly, and you can also analyze and reference attached files.

CRITICAL RULES:
1. You MUST apply the requested changes directly to the document and return the FULL, UPDATED document in your response, on the FIRST attempt.
2. NEVER return only a summary, a diff, or just the changed section—ALWAYS return the COMPLETE document HTML content, never partial content.
3. NEVER use placeholders like "<!-- Rest of content... -->" or similar shortcuts.
4. NEVER just describe the change—ALWAYS make the change in the returned document.
5. ALWAYS include ALL existing content plus your modifications.
6. When adding content, integrate it naturally into the existing document structure.
7. Preserve ALL existing content unless specifically asked to remove it.
8. When analyzing attached files, provide insightful analysis and integrate relevant information into the document when appropriate.

IMPORTANT CONTEXT:
- The user's document content is in HTML format from TipTap editor
- You must return the ENTIRE document with your changes applied
- Maintain proper HTML structure and formatting
- Preserve existing styling and structure unless specifically asked to change it
- Be aware that TipTap uses semantic HTML elements

FILE ANALYSIS CAPABILITIES:
- Analyze images and describe their content, composition, colors, text, etc.
- Extract insights from documents and reference their content
- Suggest improvements based on attached reference materials
- Compare document content with attached files
- Integrate information from multiple sources coherently

CAPABILITIES:
- Add new sections, paragraphs, headings, lists, etc.
- Modify existing content (text, styling, structure)
- Remove content when specifically requested
- Restructure document sections
- Improve formatting and styling
- Fix HTML structure issues
- Analyze and reference attached files in your edits

RESPONSE FORMAT:
When making ANY changes to the document, you MUST:
1. Provide a brief explanation of what changes you made and how you used the attached files (1-3 sentences)
2. Include the COMPLETE updated HTML content in a code block exactly like this:

\`\`\`html
[COMPLETE FULL HTML CONTENT HERE - NEVER USE PLACEHOLDERS OR SHORTCUTS]
\`\`\`

EXAMPLE:
If user asks to "analyze the attached image and add insights to the document", you would:
1. Explain: "I've analyzed the attached image showing [description] and added a new section with key insights and observations."
2. Provide the ENTIRE document HTML with the new analysis section added.

Always be helpful and make precise, targeted changes based on the user's instructions and attached files.`;

    // Build the messages array for the API call
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Add conversation history
      ...conversationHistory.map((msg: {role: string, content: string}) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Prepare the user message content
    const userTextContent = `Current document content (HTML):
${currentContent || 'No content provided.'}

${fileContexts.length > 0 ? `\nAttached files:\n${fileContexts.join('\n')}` : ''}

User instruction: ${prompt}

Please make the requested changes to the document${attachedFiles.length > 0 ? ' and incorporate insights from the attached files' : ''}.`;

    // Create user message with proper format for GPT-4o-mini (same as design analysis)
    const hasImages = attachedFiles.some(file => isImageFile(file.mimeType));
    
    if (hasImages) {
      // GPT-4o format with array content for images
      const userMessageContent: any[] = [{
        type: 'text',
        text: userTextContent
      }];
      
      // Add images in the same format as design analysis
      for (const file of attachedFiles) {
        if (isImageFile(file.mimeType)) {
          const base64Image = fileToBase64(file.content as Buffer);
          const imageUrl = `data:${file.mimeType};base64,${base64Image}`;
          
          userMessageContent.push({
            type: 'image_url',
            image_url: { url: imageUrl }
          });
        }
      }
      
      messages.push({
        role: 'user',
        content: userMessageContent
      });
    } else {
      // Regular format with string content for text-only
      messages.push({
        role: 'user',
        content: userTextContent
      });
    }

    // Debug: Log the input messages
    console.log('AI Editing Assistant - Input messages:', JSON.stringify(messages, null, 2));

    // Use GPT-4o-mini like the design analysis API
    const modelToUse = 'gpt-4o-mini';

    // Make request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages,
        max_tokens: 4000,
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
      changes: hasChanges ? [{ 
        type: 'modify', 
        description: attachedFiles.length > 0 
          ? `Content updated based on your request and analysis of ${attachedFiles.length} attached file${attachedFiles.length !== 1 ? 's' : ''}` 
          : 'Content updated based on your request', 
        location: 'document' 
      }] : [],
      hasChanges: hasChanges,
      filesProcessed: attachedFiles.length
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