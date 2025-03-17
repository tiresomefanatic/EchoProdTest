<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
  onClose: Function,
  initialPrompt: {
    type: String,
    default: ''
  }
});

const input = ref(props.initialPrompt || '');
const messages = ref([]);
const isLoading = ref(false);
const currentPrompt = ref('');

const mockResponsesMap = {
  "Help me add a new section to the Typography page": [
    {
      role: "assistant",
      content:
        "I'd be happy to help you add a new section to the Typography page. What specific topic would you like to cover in this new section?",
    },
    {
      role: "user",
      content: "I want to add a section about font pairing recommendations",
    },
    {
      role: "assistant",
      content: `Great idea! Font pairing is an important aspect of typography. Here's a draft for a new section on font pairing recommendations:

\`\`\`tsx
<section className="space-y-6">
  <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">Font Pairing Recommendations</h2>
  <p className="leading-7 max-w-3xl">
    While PP Neue Montreal is our primary typeface, strategic font pairing can enhance visual hierarchy and improve readability. Here are some recommended pairings:
  </p>
  <ul className="list-disc pl-6 space-y-2">
    <li>
      <strong>PP Neue Montreal (headings) + Inter (body):</strong> Inter's clean and modern design complements PP Neue Montreal while providing excellent readability for longer text.
    </li>
    <li>
      <strong>PP Neue Montreal (headings) + Source Serif Pro (body):</strong> For a more traditional look, pair with a serif font to create a classic yet contemporary feel.
    </li>
    <li>
      <strong>PP Neue Montreal (body) + Playfair Display (accent):</strong> Use Playfair Display for large, impactful headings or pull quotes to add a touch of elegance.
    </li>
  </ul>
  <p className="leading-7 max-w-3xl">
    Remember to maintain consistency and use font pairings judiciously to preserve the overall aesthetic of the Echo design system.
  </p>
</section>
\`\`\`

You can add this section to the existing Typography page. Would you like me to suggest where to place it within the current layout?`,
    },
  ],
  "Review this content for design guideline adherence": [
    {
      role: "assistant",
      content:
        "I'd be happy to review your content for adherence to the Echo design guidelines. Please paste the content you'd like me to review.",
    },
    {
      role: "user",
      content: `
# Welcome to Our Platform

We're excited to have you join us on this journey. Our platform offers cutting-edge solutions for all your needs.

## Key Features

1. Easy-to-use interface
2. Powerful analytics
3. Seamless integration

Get started today and experience the difference!
      `,
    },
    {
      role: "assistant",
      content: `Thank you for sharing the content. I'll review it and suggest modifications to align with the Echo design guidelines. Here's the revised version:

\`\`\`tsx
<div className="space-y-8">
  <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-[#1D1B1B]">Welcome to Our Platform</h1>
  
  <p className="leading-7 max-w-3xl text-[#1D1B1B]">
    We're excited to have you join us on this journey. Our platform offers cutting-edge solutions for all your needs.
  </p>

  <section className="space-y-4">
    <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-[#1D1B1B]">Key Features</h2>
    <ul className="list-none space-y-2">
      <li className="flex items-center gap-2">
        <span className="text-[#FF5310]">•</span>
        <span className="text-[#1D1B1B]">Easy-to-use interface</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="text-[#FF5310]">•</span>
        <span className="text-[#1D1B1B]">Powerful analytics</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="text-[#FF5310]">•</span>
        <span className="text-[#1D1B1B]">Seamless integration</span>
      </li>
    </ul>
  </section>

  <p className="leading-7 max-w-3xl text-[#1D1B1B] font-medium">
    Get started today and experience the difference!
  </p>
</div>
\`\`\`

Changes made to align with Echo design guidelines:

1. Used appropriate heading sizes and styles (h1 for main title, h2 for section title).
2. Applied the Echo color scheme (#1D1B1B for text, #FF5310 for accents).
3. Utilized the recommended typography classes (scroll-m-20, tracking-tight, etc.).
4. Structured the content with proper spacing using Tailwind classes.
5. Used Echo's font weight conventions (bold for main title, semibold for section title, medium for call-to-action).

This revised version maintains your content while ensuring it fits seamlessly into the Echo design system. Would you like me to explain any of these changes in more detail?`,
    },
  ],
};

const examplePrompts = [
  "Help me add a new section to the Typography page",
  "Review this content for design guideline adherence",
];

onMounted(() => {
  if (props.initialPrompt) {
    handleSubmit();
  }
});

const handleSubmit = () => {
  if (!input.value.trim()) return;

  messages.value.push({ role: "user", content: input.value });
  input.value = "";
  isLoading.value = true;

  // Simulate AI response
  setTimeout(() => {
    let response;
    if (currentPrompt.value) {
      const promptResponses = mockResponsesMap[currentPrompt.value];
      if (promptResponses) {
        const nextResponseIndex = messages.value.filter(m => m.role === "assistant").length;
        response = promptResponses[nextResponseIndex] || {
          role: "assistant",
          content:
            "Is there anything specific about the Echo design system or content guidelines you'd like me to clarify or expand upon?",
        };
      }
    }

    if (!response) {
      response = {
        role: "assistant",
        content: `I can assist you with:
- Adding new sections or content to existing pages
- Reviewing and adapting content to fit Echo design guidelines
- Suggesting improvements for typography, color usage, and layout
- Explaining Echo design system components and their proper usage

What specific task would you like help with today?`,
      };
    }

    messages.value.push(response);
    isLoading.value = false;
  }, 1000);
};
</script>

<template>
  <div class="fixed bottom-4 right-4 w-[380px] h-[540px] z-50 flex flex-col bg-[#FAFAFA99] backdrop-blur-[27px] rounded-md border">
    <div class="flex items-center justify-between border-b p-3">
      <div class="flex items-center gap-2">
        <!-- Bot icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5 text-[#FF5310]"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
        <span class="font-semibold text-black">AI Writing Assistant</span>
      </div>
      <button class="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100" @click="props.onClose">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
    <div class="flex-1 overflow-auto p-4">
      <!-- Empty state with prompt suggestions -->
      <div v-if="messages.length === 0" class="text-center space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-12 h-12 text-[#FF5310] mx-auto"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
        <div class="max-w-sm mx-auto">
          <h3 class="font-semibold text-lg mb-2 text-black">Echo Design System Assistant</h3>
          <p class="text-gray-500 mb-4">
            Select a suggested prompt or write your own message to get started with content creation or review.
          </p>
          <div class="flex flex-col gap-2">
            <button
              v-for="prompt in examplePrompts"
              :key="prompt"
              class="text-left h-auto p-4 text-black border rounded-md hover:bg-[#FF5310]/5 hover:border-[#FF5310] transition-colors"
              @click="() => { input = prompt; currentPrompt = prompt; }"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
      </div>

      <!-- Conversation -->
      <div v-else class="space-y-4">
        <div
          v-for="(message, i) in messages"
          :key="i"
          :class="`flex gap-3 max-w-[90%] ${
            message.role === 'assistant' ? 'bg-gray-100 p-4 rounded-lg' : 'mb-4'
          } ${message.role === 'user' ? 'ml-auto' : ''}`"
        >
          <!-- Bot icon for assistant -->
          <svg
            v-if="message.role === 'assistant'"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-6 h-6 text-[#FF5310] mt-1"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
          
          <!-- User icon for user -->
          <svg
            v-if="message.role === 'user'"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-6 h-6 text-[#FF5310] mt-1"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          
          <div class="whitespace-pre-wrap text-black">{{ message.content }}</div>
        </div>
        
        <!-- Loading indicator -->
        <div v-if="isLoading" class="flex gap-3 bg-gray-100 p-4 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-6 h-6 text-[#FF5310] animate-pulse"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
