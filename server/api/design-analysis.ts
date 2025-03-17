import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { ChatOpenAI } from '@langchain/openai';
import { 
  HumanMessage, 
  SystemMessage,
  AIMessage,
  BaseMessage
} from '@langchain/core/messages';
import { 
  BufferWindowMemory, 
  ChatMessageHistory 
} from 'langchain/memory';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// For production, you should use environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;

// Hero Vida design principles prompt
const designPrinciples = `
# Hero Vida Design System Guide

This guide outlines criteria for evaluating new designs to ensure compliance with Hero Vida's brand identity (no hex codes for now).

## 1. Logo Compliance

- **Logo Color**: Must use primary color: #FF5310
- **Allowed Variations**: full_color, monochrome
- **Prohibited Variations**: stretched, distorted, rotated
- **Evaluation Criteria**:
  - Correct logo colors from brand guidelines
  - Appropriate sizing and proportional scaling (no distortion)
  - Adherence to minimum and maximum allowed sizes
  - Proper placement and sufficient clear space around the logo
  - Only approved logo variations used; prohibited variations avoided
  - Logo integrity maintained (no unwanted alterations)

## 2. Color Palette Compliance

- **Primary Colors**: #FF5310, #FFFFFF, #1D1B1B
- **Secondary Colors**: #00EDFF, #FF0000
- **Neutral Colors**: #ReplaceWithNeutralColor1, #ReplaceWithNeutralColor2
- **Allowed Combinations**:
  - Primary 1 + Secondary 1
  - Neutral 1 + Primary 2
- **Prohibited Combinations**:
  - Primary 1 + Neutral 2
- **Evaluation Criteria**:
  - Correct usage and proportions of primary, secondary, and neutral colors
  - Only allowed color combinations used; prohibited combinations avoided
  - Colors harmonize effectively together
  - Adequate color contrast for accessibility and readability

## 3. Typography Compliance

- **Primary Font**:
  - Name: PP Neue Montreal
  - Usage: Headings/Titles/Body Text/Everything
  - Allowed Styles: Regular, Bold
- **Heading Sizes**:
  - ReplaceWithHeadingSize1
  - ReplaceWithHeadingSize2
  - ReplaceWithHeadingSize3
- **Body Text Size**: ReplaceWithBodyTextSize
- **Allowed Line Spacing**: ReplaceWithLineSpacing
- **Evaluation Criteria**:
  - Correct fonts and allowed font styles used
  - Appropriate font sizes with clear typographic hierarchy
  - Proper line spacing for readability
  - Correct text alignment and letter/word spacing
  - High readability and accessibility

## 4. Layout and Composition Compliance

- **Grid System**: ReplaceWithGridSystemDescription (e.g., 12-column grid)
- **Image Placement & Ratios**: Images placed in allowed areas with correct aspect ratios
- **Whitespace Usage**: Effective use of whitespace to enhance clarity and visual appeal
- **Alignment & Balance**:
  - Consistent alignment of elements (left, center, right)
  - Balanced composition across design elements
- **Spacing & Padding**: Consistent spacing between elements; correct padding applied
- **Visual Hierarchy**: Clear visual hierarchy established through size, color, spacing, and alignment

## 5. Tone and Messaging Compliance

- **Brand Voice & Communication Style**: Courage, Honesty, Optimism
- **Brand Tone**: Positive, Influential, Resilient
- **Brand Verbal Identity**: Genuine, Empathetic, Ambitious, Quirky
- **Allowed Keywords**: ReplaceWithKeyword1, ReplaceWithKeyword2
- **Prohibited Keywords**: ReplaceWithProhibitedKeyword1, ReplaceWithProhibitedKeyword2
- **Evaluation Criteria**:
  - Messaging clearly reflects brand voice/tone
  - Appropriate keyword usage; prohibited keywords avoided
  - Clear, concise messaging appropriate for the target audience
  - Text free from grammatical and spelling errors

## 6. Imagery Compliance

- **Photography & Illustration Style**: Consistent with brand's photography/illustration style
- **Allowed Image Types**:
  - Photography
  - Illustrations
  - Icons
- **Prohibited Image Types**:
  - Stock photos with generic people
- **Image Filters & Effects**: Only approved filters/effects used
- **Evaluation Criteria**:
  - High-quality imagery relevant to the brand message

## 7. Iconography Compliance

- **Icon Style**: ReplaceWithIconStyle (e.g., line icons)
- **Icon Color**: #ReplaceWithIconColor
- **Icon Size**: ReplaceWithIconSize
- **Evaluation Criteria**:
  - Consistent icon style usage across designs
  - Correct icon color and size adherence

## 8. Overall Brand Consistency

Evaluate if the design maintains overall consistency in visual appearance, messaging tone, and brand identity:

- **Visual Consistency**: Visually aligns with Hero Vida's established brand identity across all elements
- **Messaging Consistency**: Messaging aligns clearly with established brand voice guidelines
- **Overall Impression**: Design accurately represents Hero Vida's values and intended audience positioning

## Examples of Compliance vs Non-compliance

- **Logo Usage**:
  - Compliant: URL_to_compliant_logo_usage_image
  - Non-Compliant: URL_to_non_compliant_logo_usage_image

- **Layout**:
  - Compliant: URL_to_compliant_layout_image
  - Non-Compliant: URL_to_non_compliant_layout_image

- **Tone Examples**:
  - Compliant: ReplaceWithCompliantTextExample
  - Non-Compliant: ReplaceWithNonCompliantTextExample

**Note**: Each example should be accompanied by a brief explanation clarifying why it is compliant or non-compliant based on the criteria above.

Use this comprehensive design guide as a checklist when evaluating new designs to ensure they strictly adhere to Hero Echo's design system standards.
`;

// Maximum number of messages to keep in conversation history
const MAX_CONVERSATION_MESSAGES = 8;

export default defineEventHandler(async (event) => {
  try {
    // Validate OpenAI API Key
    if (!openaiApiKey) {
      throw createError({
        statusCode: 500,
        message: 'OpenAI API key not configured',
      });
    }

    // Read multipart form data (files and text)
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided',
      });
    }

    // Extract text content, files, and conversation history
    let textContent = '';
    let conversationHistory: any[] = [];
    const imageDataList = [];

    for (const part of formData) {
      if (part.name === 'content') {
        textContent = part.data.toString();
      } else if (part.name === 'conversation') {
        try {
          conversationHistory = JSON.parse(part.data.toString());
        } catch (e) {
          console.error('Error parsing conversation history:', e);
        }
      } else if (part.name === 'files' && part.filename) {
        // Convert the Buffer to base64 string correctly
        const base64Image = Buffer.from(part.data).toString('base64');
        const mimeType = part.type || 'image/png';
        imageDataList.push({
          filename: part.filename,
          base64Image,
          mimeType
        });
      }
    }

    if (imageDataList.length === 0 && !textContent && conversationHistory.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No content, images, or conversation history to analyze',
      });
    }

    console.log('Images:', imageDataList.length);
    console.log('Conversation history length:', conversationHistory.length);

    // Initialize the LangChain chat model
    const model = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: "gpt-4o-mini",
      maxTokens: 10000,
    });

    // Create the system prompt
    const systemPrompt = new SystemMessage(`You are a design expert who evaluates visual designs against Hero Vida's design principles and answers general design questions by using the design principles as a checklist. 
${designPrinciples}

When analyzing designs:
- Use proper markdown formatting in your responses
- For each design element you analyze, use this structure:
  - **Element**: [Name of element being analyzed]
  - **Finding**: [Your evaluation]
  - **Recommendation**: [Your suggestion if applicable]
- Use headings (## and ###) to organize sections
- Use bullet points and numbered lists to organize related points
- Use **bold** for emphasis on important findings

For general questions that are not design analysis requests:
- Respond normally in conversational format using proper markdown
- Use headings, lists, and emphasis where appropriate
- Draw upon the design principles when relevant`);

    // Build the chat message history from previous conversation
    const pastMessages: BaseMessage[] = [];

    // Limit conversation history to MAX_CONVERSATION_MESSAGES
    // Take only the most recent messages if we exceed the max
    const limitedConversationHistory = conversationHistory.slice(
      Math.max(0, conversationHistory.length - MAX_CONVERSATION_MESSAGES)
    );

    // Convert history to LangChain message format
    for (const msg of limitedConversationHistory) {
      if (msg.role === 'user') {
        pastMessages.push(new HumanMessage(msg.content || ''));
      } else if (msg.role === 'assistant') {
        pastMessages.push(new AIMessage(msg.content || ''));
      }
    }

    // Create a message history instance
    const messageHistory = new ChatMessageHistory(pastMessages);
    
    // Set up a buffer window memory with our max limit
    const memory = new BufferWindowMemory({
      chatHistory: messageHistory,
      k: MAX_CONVERSATION_MESSAGES,
      returnMessages: true,
      memoryKey: "chat_history",
    });

    console.log('memory', memory);

    // Prepare current user message content
    let userMessageContent = '';
    const imageUrlParts: string[] = [];
    
    // Add text content if available
    if (textContent) {
      userMessageContent = textContent;
    } else if (imageDataList.length > 0) {
      userMessageContent = "Please analyze the following design against Hero Vida's design principles.";
    } else {
      userMessageContent = "Please analyze this design based on our previous conversation.";
    }

    // Add images as inline markdown if they exist
    if (imageDataList.length > 0) {
      // For each image, create a data URL and add it to the content
      for (const imageData of imageDataList) {
        const imageUrl = `data:${imageData.mimeType};base64,${imageData.base64Image}`;
        imageUrlParts.push(imageUrl);
      }
    }

    // Create the current human message - we need to handle both text and images
    const currentHumanMessage = imageUrlParts.length > 0 
      ? new HumanMessage({
          content: [
            { type: "text", text: userMessageContent },
            ...imageUrlParts.map(url => ({
              type: "image_url",
              image_url: { url }
            }))
          ]
        })
      : new HumanMessage(userMessageContent);

    // Get the chat history
    const chatHistory = await memory.loadMemoryVariables({});
    
    // Create a template for the current chat
    const chatPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt.content],
      ...chatHistory.chat_history,
      ["human", userMessageContent]
    ]);

    // Create an LLM chain
    const chain = RunnableSequence.from([
      chatPrompt,
      model,
      new StringOutputParser()
    ]);

    // Instead of using the chain directly, we'll use the model with messages
    // to properly handle the image content
    const messages = [
      systemPrompt,
      ...chatHistory.chat_history,
      currentHumanMessage
    ];

    console.log('messages', messages);

    // Execute the model with our messages
    const response = await model.invoke(messages);
    const llmResponse = response.content as string;

    // Save the new messages to memory for next time
    await memory.saveContext(
      { input: userMessageContent },
      { output: llmResponse }
    );

    // Parse the response based on request type
    const feedbackCategories = detectIfDesignAnalysisQuery(userMessageContent, imageDataList)
      ? [
          {
            category: "Design Analysis",
            icon: "eye",
            items: parseResponseIntoItems(llmResponse)
          }
        ]
      : [
          {
            category: "Response",
            icon: "message-circle",
            items: [{ type: 'text', message: llmResponse }]
          }
        ];

    return {
      feedback: feedbackCategories
    };
  } catch (error: unknown) {
    console.error('Error in design analysis:', error);
    
    // Type assertion to any
    if (error instanceof Error) {
      console.error(error.message);
      throw createError({
        statusCode: 500,
        message: `Error: ${error.message}`,
      });
    }

    // Handle other types of errors
    throw createError({
      statusCode: 500,
      message: `Error: ${String(error)}`,
    });
  }
});

// Helper function to detect if the query is for design analysis
function detectIfDesignAnalysisQuery(text: string, images: any[]): boolean {
  // Consider it a design analysis if there are images attached
  if (images && images.length > 0) return true;
  
  // Check text content for design analysis keywords
  const designAnalysisKeywords = [
    'analyze', 'analysis', 'design', 'evaluate', 'assessment',
    'review', 'compliance', 'principles', 'critique', 'feedback'
  ];
  
  const textLower = text.toLowerCase();
  return designAnalysisKeywords.some(keyword => textLower.includes(keyword)) ||
    textLower.includes('how does this look') ||
    textLower.includes('what do you think');
}

// Helper function to parse LLM response into structured items
function parseResponseIntoItems(text: string) {
  // Split by lines
  const lines = text.split('\n').filter(line => line.trim());
  
  // Check if the text follows our expected format with elements, findings, etc.
  const hasStructuredFormat = text.includes('**Element**:') || 
                             text.includes('**Finding**:') ||
                             text.includes('## ');
  
  // If it's already in a structured markdown format, return it as a single item
  if (hasStructuredFormat) {
    return [{
      type: 'markdown',
      message: text
    }];
  }
  
  // For non-structured responses, process each line into a feedback item
  return lines.map(line => {
    // Remove bullet points, dashes, etc.
    let cleanedLine = line.replace(/^[\s•\-\*]+/, '').trim();
    
    // Try to determine type based on keywords
    let type = 'default';
    
    if (/✓|success|good|excellent|well done|works well|compliant|correct/i.test(cleanedLine)) {
      type = 'success';
    } else if (/⚠|warning|consider|could|might|suggest|improve/i.test(cleanedLine)) {
      type = 'warning';
    } else if (/✗|error|issue|problem|fail|incorrect|wrong|non-compliant/i.test(cleanedLine)) {
      type = 'error';
    }
    
    return {
      type,
      message: cleanedLine
    };
  });
} 