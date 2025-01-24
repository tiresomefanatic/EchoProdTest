// composables/useNavigation.ts
import { computed } from "vue";
import type { Ref } from "vue";
import { useNavigationStore } from "../store/navigation";
import { storeToRefs } from "pinia";
import { useGithub } from "./useGithub";
import { watch } from "vue";

// Type definitions
interface BaseNavigationItem {
  title: string;
  path: string;
  type: "file" | "directory";
  locked: boolean;
}

interface DirectoryItem extends BaseNavigationItem {
  type: "directory";
  children: NavigationItem[];
}

interface FileItem extends BaseNavigationItem {
  type: "file";
}

type NavigationItem = DirectoryItem | FileItem;

interface NavigationData {
  navigation: NavigationItem[];
}

export const useNavigation = () => {
  const navigationStore = useNavigationStore();
  const { currentBranch } = useGithub();

  // Get reactive refs from the store using storeToRefs
  const { isLoading, error } = storeToRefs(navigationStore);

  // Watch for branch changes to update navigation
  watch(currentBranch, (newBranch) => {
    if (newBranch) {
      navigationStore.setBranch(newBranch);
    }
  });

  const refreshNavigation = async (forceFetch = false) => {
    console.log("Refreshing navigation, force:", forceFetch);
    await navigationStore.fetchNavigation(forceFetch);
  };

  // Helper function to check if an item is a directory
  const isDirectory = (item: NavigationItem): item is DirectoryItem => {
    return navigationStore.isDirectory(item);
  };

  // Helper function to find an item by path
  const findItemByPath = (path: string): NavigationItem | null => {
    return navigationStore.findItemByPath(path);
  };

  // Helper function to get parent item
  const findParentItem = (path: string): DirectoryItem | null => {
    return navigationStore.findParentItem(path);
  };

  // Helper function to get breadcrumb trail
  const getBreadcrumbs = (path: string): NavigationItem[] => {
    return navigationStore.getBreadcrumbs(path);
  };

  return {
    // Use computed to ensure reactivity with the store
    navigationStructure: computed(() => navigationStore.getCurrentStructure),
    isLoading,
    error,
    refreshNavigation,
    findItemByPath,
    findParentItem,
    getBreadcrumbs,
    isDirectory,
  };
};
