# TiptapEditor.vue
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import { Node } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";
import Image from "@tiptap/extension-image";
import ColorWheelExtension from "~/extensions/colorWheelExtension";
import CollaborationSidebar from "~/components/CollaborationSidebar.vue";
import { useGithub } from "~/composables/useGithub";
import { useToast } from "~/composables/useToast";
import { useNuxtApp } from "#app";
import AddContentDialog from "./AddContentDialog.vue";
import type { editor as MonacoEditor } from "monaco-editor";
import { useEditorStore } from "~/store/editor";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { useStore } from "~/store";
import { storeToRefs } from "pinia";
import TextAlign from "@tiptap/extension-text-align";

import { FontSize, fontSizeOptions } from "~/extensions/fontSizeExtension";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";

import ImageUploader from "~/components/ImageUploader.vue";

interface Props {
  content?: string;
  filePath: string;
}

const handleInsertComponent = (componentId: string) => {
  if (!editor.value) return;

  switch (componentId) {
    case "colorwheel":
      editor.value
        .chain()
        .focus()
        .insertContent({
          type: "colorWheel",
        })
        .run();
      break;
  }
};

const templates = {
  "split-with-image": `
    <div style="display: flex; gap: 2rem; margin: 3rem 0;">
      <div style="flex: 1;">
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; line-height: 1.4;">Section Title</h2>
      </div>
      <div style="flex: 2;">
        <div style="background: #f5f5f5; padding: 2rem; border-radius: 4px;">
          <img src="/api/placeholder/800/400" alt="Section Image" style="width: 100%; height: auto; display: block;" />
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin: 1rem 0;">Add Subtitle</h3>
        <p style="margin: 1rem 0; line-height: 1.6;">Add your description here.</p>
        <p style="margin: 1rem 0; line-height: 1.6;">Add additional details here.</p>
      </div>
    </div>
  `,
  "split-with-list": `
    <div style="display: flex; gap: 2rem; margin: 3rem 0;">
      <div style="flex: 1;">
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; line-height: 1.4;">Section Title</h2>
      </div>
      <div style="flex: 2;">
        <img src="/api/placeholder/800/400" alt="Section Image" style="width: 100%; height: auto; display: block; padding: 2rem; border-radius: 4px;" />
        <p style="margin: 1rem 0; line-height: 1.6;">Add your description here.</p>
        <ul style="list-style: none; padding: 0; margin: 1rem 0;">
          <li style="margin: 0.5rem 0; line-height: 1.6;">List item one</li>
          <li style="margin: 0.5rem 0; line-height: 1.6;">List item two</li>
          <li style="margin: 0.5rem 0; line-height: 1.6;">List item three</li>
          <li style="margin: 0.5rem 0; line-height: 1.6;">List item four</li>
        </ul>
      </div>
    </div>
  `,
};

const handleInsertSection = (sectionId: string) => {
  if (!editor.value) return;

  const template = templates[sectionId];
  if (template) {
    editor.value
      .chain()
      .focus()
      .createParagraphNear()
      .insertContent(template)
      .focus()
      .run();
  }
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:content": [content: string];
  save: [content: string];
  error: [error: Error];
}>();

// State management
const localContent = ref(props.content || "");
const originalContent = ref("");
const isSaving = ref(false);
const previewMode = ref(false);
const rawMode = ref(false);
const editor = ref<Editor | null>(null);
const editorInitialized = ref(false);
const previewContent = ref("");
const monacoEditor = ref<any>(null);
const showCommitDialog = ref(false);
const commitMessage = ref("");
const isCommitting = ref(false);
const showImageDialog = ref(false);

// Store setup
const store = useStore();
const { rawText, isPreviewActive } = storeToRefs(store);
const editorStore = useEditorStore();
const {
  getFileContent,
  currentBranch,
  saveFileContent,
  fetchBranches,
  isLoggedIn,
} = useGithub();
const { showToast } = useToast();

// Node extensions with style support
const StyledDiv = Node.create({
  name: "styledDiv",
  group: "block",
  content: "block+",
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "div" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});

const GridContainer = Node.create({
  name: "gridContainer",
  group: "block",
  content: "block+",
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (node) => {
          const style = node.getAttribute("style") || "";
          return style.includes("grid") ? {} : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});

// Format and parse functions
const normalizeHTML = (html: string): string => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerHTML;
};

const formatHTML = (html: string): string => {
  if (!html) return "";

  html = html
    .replace(
      /<div[^>]*data-type="color-wheel"[^>]*>.*?<\/div>/g,
      "\n::color-wheel\n::\n"
    )
    .replace(
      /<div[^>]*data-type="test-component"[^>]*>.*?<\/div>/g,
      "\n::test-component\n::\n"
    );

  let formattedHTML = html
    .replace(/<strong>/g, "§§STRONG§§")
    .replace(/<\/strong>/g, "§§/STRONG§§")
    .replace(/<em>/g, "§§EM§§")
    .replace(/<\/em>/g, "§§/EM§§");

  formattedHTML = formattedHTML
    .replace(/></g, ">\n<")
    .replace(
      /(<div[^>]*>|<\/div>|<p>|<\/p>|<h[1-6]>|<\/h[1-6]>|<ul>|<\/ul>|<ol>|<\/ol>|<li>|<\/li>)/g,
      (match) => `\n${match}\n`
    )
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  formattedHTML = formattedHTML
    .replace(/§§STRONG§§/g, "<strong>")
    .replace(/§§\/STRONG§§/g, "</strong>")
    .replace(/§§EM§§/g, "<em>")
    .replace(/§§\/EM§§/g, "</em>");

  return formattedHTML.replace(/\n{3,}/g, "\n\n").trim();
};

const parseMarkdownToHTML = (content: string): string => {
  if (!content) return "";

  return content
    .replace(/::color-wheel\s*::/g, '<div data-type="color-wheel"></div>')
    .replace(
      /::test-component\s*::/g,
      '<div data-type="test-component"></div>'
    );
};

// Monaco editor options
const editorOptions = {
  theme: "vs",
  language: "html",
  fontSize: 13,
  lineNumbers: "on",
  renderWhitespace: "selection",
  minimap: {
    enabled: true,
    scale: 1,
    showSlider: "mouseover",
  },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  lineHeight: 20,
  padding: { top: 16, bottom: 16 },
  folding: true,
  foldingHighlight: true,
  foldingStrategy: "indentation",
  showFoldingControls: "always",
  bracketPairColorization: {
    enabled: true,
  },
  autoClosingBrackets: "always",
  autoClosingQuotes: "always",
  autoClosingTags: true,
  formatOnType: true,
  formatOnPaste: true,
  autoIndent: "advanced",
  tabSize: 2,
  automaticLayout: true,
  scrollbar: {
    vertical: "visible",
    horizontal: "visible",
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  suggest: {
    snippetsPreventQuickSuggestions: false,
    showWords: false,
    showClasses: true,
    showTags: true,
    showAttributes: true,
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
};

// Computed properties
const showCommitButton = computed(() => {
  return props.filePath && currentBranch.value;
});

const hasChanges = computed(() => {
  if (!props.filePath) return false;
  const gitContent = editorStore.getCurrentGitContent(props.filePath);
  return gitContent
    ? localContent.value !== gitContent.content
    : localContent.value !== "";
});

const sanitizedPreviewContent = computed(() => {
  return previewContent.value || localContent.value;
});

// Save and commit handlers
const handleSave = () => {
  if (!props.filePath) return;

  // Format the content before saving
  const formattedContent = formatHTML(localContent.value);
  console.log("Editor saving content - Length:", formattedContent.length);
  console.log("Preview:", formattedContent.substring(0, 100) + "...");

  // Save formatted content to Pinia store
  editorStore.saveContent(props.filePath, formattedContent);

  // Update store's raw text
  store.updateRawText(formattedContent);

  // Also save current content to localStorage for recovery
  localStorage.setItem("rawText", JSON.stringify(formattedContent));

  showToast({
    title: "Changes Saved",
    message: "Successfully saved changes",
    type: "success",
  });
};

// const saveToLocal = () => {
//   if (!hasChanges.value || isSaving.value) return;
//   editorStore.saveContent(props.filePath, localContent.value);
//   showToast({
//     title: "Success",
//     message: "Content saved locally",
//     type: "success",
//   });
// };

const handleCommit = async () => {
  if (!props.filePath || !commitMessage.value.trim()) return;

  isCommitting.value = true;
  try {
    await saveFileContent(
      "tiresomefanatic",
      "EchoProdTest",
      props.filePath,
      localContent.value,
      commitMessage.value.trim(),
      currentBranch.value
    );

    // Update git content in store
    editorStore.updateContent(props.filePath, localContent.value);

    showToast({
      title: "Success",
      message: "Changes committed successfully",
      type: "success",
    });

    showCommitDialog.value = false;
    commitMessage.value = "";
  } catch (error) {
    console.error("Commit error:", error);
    const errorMessage =
      error.status === 409
        ? "File was modified elsewhere. Please try committing again."
        : error.message || "Failed to commit changes";

    showToast({
      title: "Error",
      message: errorMessage,
      type: "error",
      duration: 5000,
    });
  } finally {
    isCommitting.value = false;
  }
};

const handleLoadSave = async (content: string) => {
  console.log("Editor received content - Length:", content?.length);
  console.log("Preview:", content?.substring(0, 100) + "...");

  if (!content) {
    console.error("Empty content received");
    showToast({
      title: "Error",
      message: "No content to load",
      type: "error",
    });
    return;
  }

  try {
    editorStore.updateContent(props.filePath || "", content);
    if (editor.value) {
      editor.value.commands.setContent(content);
    }
    localContent.value = content;

    await nextTick();

    showToast({
      title: "Save Loaded",
      message: "Successfully loaded saved version",
      type: "success",
    });
  } catch (error) {
    console.error("Error loading content:", error);
    showToast({
      title: "Error",
      message: "Failed to load content",
      type: "error",
    });
  }
};

const handleImageUploaded = (details: {
  url: string;
  alt: string;
  alignment: string;
}) => {
  if (!editor.value) return;

  editor.value
    .chain()
    .focus()
    .setImage({
      src: details.url,
      alt: details.alt,
    })
    .run();

  // Set alignment
  const imageNode = editor.value.view.state.selection.$anchor.nodeAfter;
  if (imageNode) {
    editor.value
      .chain()
      .focus()
      .setNodeAttribute(
        imageNode.type,
        "style",
        `display: block; margin: 0 ${
          details.alignment === "center" ? "auto" : "0"
        }; float: ${
          details.alignment === "center" ? "none" : details.alignment
        }`
      )
      .run();
  }

  showImageDialog.value = false;
};

const handleImageError = (message: string) => {
  showToast({
    title: "Error",
    message,
    type: "error",
  });
};

const setLink = () => {
  const url = window.prompt("URL");

  // cancelled
  if (url === null) {
    return;
  }

  // empty
  if (url === "") {
    editor.value?.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  // Ensure URL has protocol
  let finalUrl = url;
  if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
    finalUrl = "https://" + url;
  }

  // Set new link
  editor.value
    ?.chain()
    .focus()
    .extendMarkRange("link")
    .unsetLink()
    .setLink({ href: finalUrl })
    .run();
};

const removeLink = () => {
  editor.value?.chain().focus().unsetLink().run();
};

const handleRawContentChange = (value: string) => {
  if (!value) return;
  const formattedContent = formatHTML(value);
  localContent.value = formattedContent;
  previewContent.value = formattedContent;
  emit("update:content", formattedContent);
};

// Watch for content changes
watch(
  () => rawText.value,
  (newContent) => {
    if (newContent && editor.value && newContent !== localContent.value) {
      console.log("rawText changed, updating localContent:", newContent.length);
      const formattedContent = formatHTML(newContent);
      editor.value.commands.setContent(formattedContent);
      localContent.value = formattedContent;
    }
  }
);

watch(
  () => editorStore.getCurrentGitContent(props.filePath || "")?.content,
  (newContent) => {
    if (newContent && editor.value) {
      console.log("Git content updated:", newContent.substring(0, 100) + "...");
      editor.value.commands.setContent(newContent);
      localContent.value = newContent;
    }
  }
);

// Watch for raw mode changes
watch(rawMode, (newValue) => {
  if (editor.value) {
    if (!newValue) {
      // When switching from raw mode back to normal mode, format the content
      const formattedContent = formatHTML(localContent.value);
      editor.value.commands.setContent(formattedContent, false);
      previewContent.value = formattedContent;
      localContent.value = formattedContent;
    }
  }
});

watch(previewMode, (newValue) => {
  if (newValue && editor.value) {
    const content = formatHTML(editor.value.getHTML());
    previewContent.value = content;
  }
});

// Watch content prop changes
watchEffect(() => {
  if (localContent.value !== "") {
    emit("update:content", localContent.value);
  }
});

// Initialize
onMounted(async () => {
  editorStore.loadSaves();

  if (isLoggedIn.value) {
    await fetchBranches();
  }

  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        document: false,
        paragraph: false,
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      Document,
      Text,
      Paragraph.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TextStyle,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),

      FontSize.configure({
        types: ["textStyle"],
      }),
      Heading.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: null,
        },
      }),
      Link.configure({
        openOnClick: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: {
          class: "editor-link",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      // StyledDiv,
      // GridContainer,
      ColorWheelExtension.configure({
        HTMLAttributes: {
          class: "color-wheel-node",
        },
      }),
    ],
    editorProps: {
      attributes: {
        spellcheck: "false",
      },
      transformPastedHTML: (html) => {
        return html;
      },
      handleDrop: false,
      // handleClick: (view: EditorView, pos: number, event: MouseEvent) => {
      //   // Get the precise position
      //   const precise = view.posAtCoords({
      //     left: event.clientX,
      //     top: event.clientY,
      //   });

      //   if (!precise) return false;

      //   const { pos: precisePos } = precise;
      //   const $pos = view.state.doc.resolve(precisePos);

      //   // Check if we're actually clicking on text content
      //   const domAtPos = view.domAtPos(precisePos);
      //   if (!domAtPos) return false;

      //   const { node: domNode, offset } = domAtPos;
      //   const element = event.target as HTMLElement;

      //   // If clicking on/near an image, don't interfere
      //   if (element.nodeName === "IMG" || element.closest("img")) {
      //     return false;
      //   }

      //   // Create selection at the precise click position
      //   view.dispatch(
      //     view.state.tr.setSelection(
      //       TextSelection.create(view.state.doc, precisePos)
      //     )
      //   );

      //   view.focus();
      //   return true;
      // },
      // handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
      //   if (event.key === "Enter") {
      //     const { state } = view;
      //     const { selection } = state;
      //     const { $from } = selection;
      //     const parent = $from.parent;

      //     // Find the current flex container
      //     let currentFlexDepth = $from.depth;
      //     let flexContainer = null;

      //     while (currentFlexDepth > 0) {
      //       const node = $from.node(currentFlexDepth);
      //       if (
      //         node.type.name === "styledDiv" &&
      //         node.attrs.style?.includes("display: flex")
      //       ) {
      //         flexContainer = node;
      //         break;
      //       }
      //       currentFlexDepth--;
      //     }

      //     if (!flexContainer) {
      //       return false;
      //     }

      //     // Check if we're in the left column (flex: 1)
      //     const isInLeftColumn = parent.attrs.style?.includes("flex: 1");

      //     // Check if we're at the end of the document
      //     const isAtEnd = $from.pos === state.doc.content.size;

      //     if (isAtEnd && event.shiftKey) {
      //       // Create a new section at the end
      //       view.dispatch(
      //         state.tr.insert(
      //           $from.pos,
      //           state.schema.nodes.styledDiv.create(
      //             { style: "display: flex; gap: 2rem; margin: 3rem 0;" },
      //             [
      //               state.schema.nodes.styledDiv.create({ style: "flex: 1;" }, [
      //                 state.schema.nodes.paragraph.create(),
      //               ]),
      //               state.schema.nodes.styledDiv.create({ style: "flex: 2;" }, [
      //                 state.schema.nodes.paragraph.create(),
      //               ]),
      //             ]
      //           )
      //         )
      //       );
      //       return true;
      //     } else if (isInLeftColumn) {
      //       // If in left column and Shift+Enter is pressed, create a new line within the column
      //       if (event.shiftKey) {
      //         view.dispatch(
      //           state.tr.insert(
      //             $from.pos,
      //             state.schema.nodes.hardBreak.create()
      //           )
      //         );
      //         return true;
      //       }
      //       // Regular Enter in left column moves to right column
      //       const rightColumn = flexContainer.lastChild;
      //       if (rightColumn) {
      //         const domNode = view.nodeDOM(rightColumn.pos) as Node;
      //         if (domNode) {
      //           const targetPos = view.posAtDOM(domNode, 0);
      //           view.dispatch(
      //             state.tr.setSelection(
      //               TextSelection.create(state.doc, targetPos)
      //             )
      //           );
      //           return true;
      //         }
      //       }
      //     } else {
      //       // In right column, normal Enter behavior
      //       return false;
      //     }
      //   }

      //   if (event.key === "Tab") {
      //     return true;
      //   }

      //   return false;
      // },
    },
    // onUpdate: ({ editor: ed }) => {
    //   const { selection } = ed.state;
    //   const { $from } = selection;
    //   const parent = $from.parent;

    //   if (
    //     parent.type.name === "styledDiv" &&
    //     parent.attrs.style?.includes("display: flex")
    //   ) {
    //     const currentNode = $from.node();
    //     const parentPos = $from.before($from.depth);

    //     let targetPos = parentPos;
    //     let targetDepth = $from.depth;

    //     while (targetDepth > 1) {
    //       const node = $from.node(targetDepth);
    //       if (node.attrs.style?.includes("display: flex")) {
    //         targetPos = $from.before(targetDepth);
    //         break;
    //       }
    //       targetDepth--;
    //     }

    //     const content = formatHTML(ed.getHTML());
    //     localContent.value = content;
    //     previewContent.value = content;
    //     emit("update:content", content);
    //   } else {
    //     const content = formatHTML(ed.getHTML());
    //     localContent.value = content;
    //     previewContent.value = content;
    //     emit("update:content", content);
    //   }
    // },
    onUpdate: ({ editor: ed }) => {
      const content = formatHTML(ed.getHTML());
      localContent.value = content;
      previewContent.value = content;
      emit("update:content", content);
    },
    parseOptions: {
      preserveWhitespace: "full",
    },
  });

  // Initialize editor content with formatting
  if (props.content) {
    const formattedContent = formatHTML(props.content);
    editor.value.commands.setContent(formattedContent);
    localContent.value = formattedContent;
    originalContent.value = formattedContent;
  } else if (rawText.value) {
    const formattedContent = formatHTML(rawText.value);
    editor.value.commands.setContent(formattedContent);
    localContent.value = formattedContent;
    originalContent.value = formattedContent;
  }

  editorInitialized.value = true;
});

onMounted(() => {
  const editorContent = document.querySelector(".editor-content");
  if (editorContent) {
    editorContent.addEventListener("scroll", () => {
      editorContent.setAttribute(
        "data-scroll-top",
        editorContent.scrollTop.toString()
      );
    });
  }
});

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
  if (monacoEditor.value) {
    monacoEditor.value.dispose();
  }
  const editorContent = document.querySelector(".editor-content");
  if (editorContent) {
    editorContent.removeEventListener("scroll", () => {});
  }
});
</script>

<template>
  <div class="editor-wrapper">
    <div class="editor-layout">
      <div class="editor-main">
        <div class="editor-toolbar">
          <div class="toolbar-left">
            <span class="file-path">{{ props.filePath }}</span>
          </div>

          <div class="toolbar-right">
            <!-- Editor View -->
            <template v-if="!previewMode && !rawMode">
              <button class="toolbar-button" @click="rawMode = true">
                Raw
              </button>
              <button class="toolbar-button" @click="previewMode = true">
                Preview
              </button>
              <button
                v-if="showCommitButton && hasChanges"
                class="toolbar-button primary"
                @click="() => (showCommitDialog = true)"
                :title="
                  hasChanges ? 'Commit your changes' : 'No changes to commit'
                "
              >
                Commit Changes
              </button>
              <button
                v-if="hasChanges"
                class="toolbar-button primary"
                @click="handleSave"
                :title="hasChanges ? 'Save your changes' : 'No changes to save'"
              >
                Save
              </button>
            </template>

            <!-- Raw View -->
            <template v-if="rawMode">
              <button class="toolbar-button" @click="rawMode = false">
                Normal
              </button>
              <button class="toolbar-button" @click="previewMode = true">
                Preview
              </button>
              <button
                v-if="showCommitButton && hasChanges"
                class="toolbar-button primary"
                @click="() => (showCommitDialog = true)"
              >
                Commit Changes
              </button>
              <button
                v-if="hasChanges"
                class="toolbar-button primary"
                @click="handleSave"
              >
                Save
              </button>
            </template>

            <!-- Preview View -->
            <template v-if="previewMode">
              <button class="toolbar-button" @click="previewMode = false">
                Edit
              </button>
              <button
                v-if="showCommitButton && hasChanges"
                class="toolbar-button primary"
                @click="() => (showCommitDialog = true)"
              >
                Commit Changes
              </button>
              <button
                v-if="hasChanges"
                class="toolbar-button primary"
                @click="handleSave"
              >
                Save
              </button>
            </template>
          </div>
        </div>

        <div class="editor-content">
          <!-- Editor View -->
          <template v-if="!previewMode && !rawMode">
            <div class="tiptap-toolbar" v-if="editor">
              <button
                @click="editor.chain().focus().toggleBold().run()"
                :class="{ 'is-active': editor.isActive('bold') }"
              >
                Bold
              </button>
              <button
                @click="editor.chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor.isActive('italic') }"
              >
                Italic
              </button>
              <button
                @click="
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                "
                :class="{
                  'is-active': editor.isActive('heading', { level: 1 }),
                }"
              >
                H1
              </button>
              <button
                @click="
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                "
                :class="{
                  'is-active': editor.isActive('heading', { level: 2 }),
                }"
              >
                H2
              </button>
              <button
                @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'is-active': editor.isActive('bulletList') }"
              >
                List
              </button>
              <select
                class="font-size-select"
                @change="
                  (e) =>
                    editor.chain().focus().setFontSize(e.target.value).run()
                "
              >
                <option value="">Font Size</option>
                <option
                  v-for="option in fontSizeOptions"
                  :key="option.value"
                  :value="option.value"
                  :selected="
                    editor.isActive('textStyle', { fontSize: option.value })
                  "
                >
                  {{ option.label }}
                </option>
              </select>
              <div class="alignment-buttons">
                <button
                  @click="editor.chain().focus().setTextAlign('left').run()"
                  :class="{
                    'is-active': editor.isActive({ textAlign: 'left' }),
                  }"
                  title="Align left"
                >
                  <span class="align-icon">⟵</span>
                </button>
                <button
                  @click="editor.chain().focus().setTextAlign('center').run()"
                  :class="{
                    'is-active': editor.isActive({ textAlign: 'center' }),
                  }"
                  title="Align center"
                >
                  <span class="align-icon">↔</span>
                </button>
                <button
                  @click="editor.chain().focus().setTextAlign('right').run()"
                  :class="{
                    'is-active': editor.isActive({ textAlign: 'right' }),
                  }"
                  title="Align right"
                >
                  <span class="align-icon">⟶</span>
                </button>
                <button
                  @click="editor.chain().focus().setTextAlign('justify').run()"
                  :class="{
                    'is-active': editor.isActive({ textAlign: 'justify' }),
                  }"
                  title="Justify"
                >
                  <span class="align-icon">☰</span>
                </button>
              </div>
              <div class="divider"></div>
              <button
                @click="setLink"
                :class="{ 'is-active': editor.isActive('link') }"
                title="Add/edit link"
              >
                🔗
              </button>
              <button
                v-if="editor.isActive('link')"
                @click="removeLink"
                title="Remove link"
              >
                ✖️
              </button>
              <div class="divider"></div>
              <button
                @click="showImageDialog = true"
                class="toolbar-button"
                title="Insert image"
              >
                <span class="button-icon">🖼️</span>
              </button>
              <AddContentDialog
                :onInsertComponent="handleInsertComponent"
                :onInsertSection="handleInsertSection"
              />
            </div>
            <editor-content
              v-if="editorInitialized"
              :editor="editor"
              class="content-wrapper"
              :class="{ 'has-changes': hasChanges }"
            />
          </template>

          <!-- Raw View -->
          <div v-else-if="rawMode" class="raw-content-wrapper">
            <MonacoEditor
              v-model="localContent"
              class="monaco-editor"
              :options="editorOptions"
              @change="handleRawContentChange"
              @mount="(editor) => (monacoEditor = editor)"
            />
          </div>

          <!-- Preview View -->
          <div v-else class="preview-wrapper">
            <div class="content-wrapper" v-html="previewContent"></div>
          </div>
        </div>
      </div>

      <CollaborationSidebar
        v-if="props.filePath"
        :filePath="props.filePath"
        @load-save="handleLoadSave"
      />
    </div>

    <!-- Commit Dialog -->
    <div v-if="showCommitDialog" class="commit-dialog">
      <div class="commit-dialog-content">
        <h3>Commit Changes</h3>
        <div class="commit-form">
          <textarea
            v-model="commitMessage"
            placeholder="Enter commit message..."
            rows="3"
            class="commit-message-input"
            :disabled="isCommitting"
          ></textarea>
          <div class="commit-actions">
            <button
              class="cancel-button"
              @click="showCommitDialog = false"
              :disabled="isCommitting"
            >
              Cancel
            </button>
            <button
              class="commit-button"
              @click="handleCommit"
              :disabled="!commitMessage.trim() || isCommitting"
            >
              {{ isCommitting ? "Committing..." : "Commit" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showImageDialog" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Insert Image</h3>
          <button @click="showImageDialog = false" class="close-button">
            ×
          </button>
        </div>
        <div class="modal-body">
          <ImageUploader
            @uploaded="handleImageUploaded"
            @error="handleImageError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.editor-wrapper {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: row;
  background: white;
}

.editor-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  width: 100%;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: white;
}

.editor-content {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: auto;
}

/* Editor toolbar styles */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.tiptap-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.tiptap-toolbar button,
.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toolbar-right {
  display: flex;
  gap: 1rem;
  margin-top: 10px;
}

.tiptap-toolbar button:hover,
.toolbar-button:hover {
  background: #f9fafb;
}

.tiptap-toolbar button.is-active {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.toolbar-button.primary {
  background: #4361ee;
  color: white;
  border-color: #4361ee;
}

.toolbar-button.primary:hover {
  background: #3651d4;
}

.toolbar-button.active {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.toolbar-button.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.font-size-select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.font-size-select:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.font-size-select:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

/* Make sure dropdown aligns with other toolbar items */
.tiptap-toolbar select {
  height: 36px; /* Match button height */
  margin: 0;
}

.alignment-buttons {
  display: flex;
  gap: 0.5rem;
  padding: 0 0.5rem;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  margin: 0 0.5rem;
}

.alignment-buttons button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
}

.align-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.button-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  border-radius: 4px;
}

.close-button:hover {
  color: #374151;
  background: #f3f4f6;
}

.modal-body {
  padding: 1rem;
}

.editor-link {
  color: #4361ee;
  text-decoration: underline;
  cursor: pointer;
}

.editor-link:hover {
  color: #3651d4;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 0.5rem;
}

.file-path {
  color: #374151;
  font-size: 0.875rem;
}

.raw-content-wrapper {
  flex: 1;
  display: flex;
  background: #1e1e1e;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.monaco-editor {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px); /* Ensure editor has enough height */
}

.preview-wrapper {
  flex: 1;
  overflow: auto;
  background: white;
}

.preview-content {
  min-height: 100%;
  padding: 2rem;
}

/* Add styles for preview mode content */
.preview-content img {
  max-width: 100%;
  height: auto;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  margin: 1.5rem 0 1rem;
}

.preview-content p {
  margin: 1rem 0;
  line-height: 1.6;
}

/* Prose Mirror Styles */
.ProseMirror {
  position: relative;
  outline: none;
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  padding: 1rem;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid #4361ee;
}

/* Color wheel component styles */
.color-wheel-node {
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

/* Add smooth shadow effect for sticky toolbar */
.tiptap-toolbar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 4px;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.05) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.editor-content:not([data-scroll-top="0"]) .tiptap-toolbar::after {
  opacity: 1;
}

.content-wrapper {
  padding: 1rem;
  min-height: 100%;
  width: 100%;
}

/* Commit Dialog Styles */
.commit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.commit-dialog-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.commit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.commit-message-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}

.commit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.commit-button,
.cancel-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  border: none;
}

.commit-button {
  background: #4caf50;
  color: white;
}

.commit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-button {
  background: #f5f5f5;
  color: #333;
}

.cancel-button:hover {
  background: #e5e5e5;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tiptap-toolbar {
    flex-wrap: wrap;
  }

  .toolbar-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  .commit-dialog-content {
    width: 95%;
    padding: 1rem;
  }
}
</style>
