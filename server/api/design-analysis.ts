import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import OpenAI from 'openai';

// For production, you should use environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hero Vida design principles prompt
const designPrinciples = `
# Hero Echo Design System Guide

This guide outlines criteria for evaluating new designs to ensure compliance with Hero Echo's brand identity (no hex codes for now).

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

export default defineEventHandler(async (event) => {
  try {
    // Validate OpenAI API Key
    if (!openai.apiKey) {
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

    // Extract text content and files
    let textContent = '';
    const imageDataList = [];

    for (const part of formData) {
      if (part.name === 'content') {
        textContent = part.data.toString();
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

    if (imageDataList.length === 0 && !textContent) {
      throw createError({
        statusCode: 400,
        message: 'No content or images to analyze',
      });
    }

    console.log(imageDataList);

    // Prepare the messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are a design expert who evaluates visual designs against Hero Vida's design principles. 
                 ${designPrinciples}
                 
                 Format your response in easily digestible bullet points. Be specific about what works well and what could be improved.
                 For each point, indicate if it's a success, warning, or issue.`
      }
    ];
    
    // Create the user message content
    let userMessageContent: any = [];
    
    // Always add text content first if available
    if (textContent) {
      userMessageContent.push({ 
        type: "text", 
        text: textContent 
      });
    } else if (imageDataList.length > 0) {
      // If no text but images exist, add default text
      userMessageContent.push({ 
        type: "text", 
        text: "Please analyze the following design against Hero Vida's design principles." 
      });
    } else {
      // Fallback for conversation continuation
      userMessageContent = "Please analyze this design based on our previous conversation.";
    }
    
    // Add all images if they exist
    if (imageDataList.length > 0) {
      for (const imageData of imageDataList) {
        userMessageContent.push({
          type: "image_url",
          image_url: {
            url: `data:${imageData.mimeType};base64,${imageData.base64Image}`
          }
        });
      }
    }
    
    // Add the user message to the messages array
    messages.push({
      role: 'user',
      content: userMessageContent
    });

    console.log(messages);

    // Call OpenAI API 
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 10000,
    });

    // Process the response
    console.log(completion);
    const llmResponse = completion.choices[0]?.message?.content || 'No analysis could be generated.';
    
    // Parse the response into structure
    // For simplicity, we'll return a single category with the full response
    const feedbackCategories = [
      {
        category: "Design Analysis",
        icon: "eye",
        items: parseResponseIntoItems(llmResponse)
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

// Helper function to parse LLM response into structured items
function parseResponseIntoItems(text: string) {
  // Split by lines
  const lines = text.split('\n').filter(line => line.trim());
  
  // Process each line into a feedback item
  return lines.map(line => {
    // Remove bullet points, dashes, etc.
    let cleanedLine = line.replace(/^[\s•\-\*]+/, '').trim();
    
    // Try to determine type based on keywords
    let type = 'default';
    
    if (/✓|success|good|excellent|well done|works well/i.test(cleanedLine)) {
      type = 'success';
    } else if (/⚠|warning|consider|could|might|suggest/i.test(cleanedLine)) {
      type = 'warning';
    } else if (/✗|error|issue|problem|fail|incorrect|wrong/i.test(cleanedLine)) {
      type = 'error';
    }
    
    return {
      type,
      message: cleanedLine
    };
  });
} 