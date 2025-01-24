<template>
  <div class="folder-tree">
    <!-- Root folder -->
    <div
      class="folder-item root"
      :class="{ selected: selectedPath === '/' }"
      @click.stop="$emit('select', '/')"
    >
      <span class="folder-icon">📁</span>
      <span class="folder-name">Root</span>
    </div>
    <!-- Recursive folder rendering -->
    <RenderFolder
      v-for="item in items"
      :key="item.path"
      :item="item"
      :selected-path="selectedPath"
      :depth="1"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, defineComponent, h } from "vue";

interface BaseNavigationItem {
  title: string;
  path: string;
  type: "file" | "directory";
  locked: boolean;
}

interface DirectoryItem extends BaseNavigationItem {
  type: "directory";
  children?: NavigationItem[];
}

interface FileItem extends BaseNavigationItem {
  type: "file";
}

type NavigationItem = DirectoryItem | FileItem;

// Props
interface Props {
  items: NavigationItem[];
  selectedPath: string;
}

const props = defineProps<Props>();
defineEmits<{
  (e: "select", path: string): void;
}>();

// Recursive folder component
const RenderFolder = defineComponent({
  name: "RenderFolder",
  props: {
    item: {
      type: Object as () => NavigationItem,
      required: true,
    },
    selectedPath: {
      type: String,
      required: true,
    },
    depth: {
      type: Number,
      default: 1,
    },
  },
  emits: ["select"],
  setup(props, { emit }) {
    const getIndentation = (depth: number) => {
      return 20 + depth * 20;
    };

    return () => {
      if (props.item.type === "directory") {
        return h(
          "div",
          {
            class: {
              "folder-item": true,
              selected: props.selectedPath === props.item.path,
            },
            style: { paddingLeft: `${getIndentation(props.depth)}px` },
            onClick: (event) => {
              event.stopPropagation(); // Stop event propagation
              console.log("Folder Clicked:", props.item.path); // Debugging
              emit("select", props.item.path);
            },
          },
          [
            h("span", { class: "folder-icon" }, "📁"),
            h("span", { class: "folder-name" }, props.item.title),
            props.item.children && props.item.children.length
              ? h(
                  "div",
                  {},
                  props.item.children.map((child) =>
                    h(RenderFolder, {
                      item: child,
                      selectedPath: props.selectedPath,
                      depth: props.depth + 1,
                      onSelect: (path: string) => emit("select", path),
                    })
                  )
                )
              : null,
          ]
        );
      }
      return null;
    };
  },
});
</script>

<style scoped>
.folder-tree {
  padding: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.folder-item:hover {
  background: #f3f4f6;
}

.folder-item.selected {
  background: #e5e7eb;
}

.folder-icon {
  font-size: 16px;
}

.folder-name {
  font-size: 14px;
  color: #374151; /* Ensure text color is black */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
