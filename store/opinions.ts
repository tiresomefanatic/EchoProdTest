import { defineStore } from 'pinia'

export interface OpinionDraft {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  slug?: string
}

export const useOpinionsStore = defineStore('opinions', {
  state: () => ({
    drafts: [] as OpinionDraft[],
    currentDraft: null as OpinionDraft | null,
    isLoading: false
  }),

  getters: {
    getDraftById: (state) => (id: string) => {
      return state.drafts.find(draft => draft.id === id)
    },
    
    getDraftBySlug: (state) => (slug: string) => {
      return state.drafts.find(draft => draft.slug === slug)
    },

    sortedDrafts: (state) => {
      return [...state.drafts].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }
  },

  actions: {
    // Initialize store by loading from localStorage
    initStore() {
      this.loadDraftsFromStorage()
    },

    // Load drafts from localStorage
    loadDraftsFromStorage() {
      try {
        const storedDrafts = localStorage.getItem('opinion_drafts')
        if (storedDrafts) {
          this.drafts = JSON.parse(storedDrafts)
        }
      } catch (error) {
        console.error('Error loading opinion drafts from localStorage:', error)
        this.drafts = []
      }
    },

    // Save drafts to localStorage
    saveDraftsToStorage() {
      try {
        localStorage.setItem('opinion_drafts', JSON.stringify(this.drafts))
      } catch (error) {
        console.error('Error saving opinion drafts to localStorage:', error)
      }
    },

    // Create a new draft
    createDraft(title: string = 'Untitled Opinion', content: string = ''): OpinionDraft {
      const now = new Date().toISOString()
      const id = `opinion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newDraft: OpinionDraft = {
        id,
        title,
        content,
        createdAt: now,
        updatedAt: now,
        slug: this.generateSlug(title)
      }

      this.drafts.push(newDraft)
      this.saveDraftsToStorage()
      this.currentDraft = newDraft
      
      return newDraft
    },

    // Update an existing draft
    updateDraft(id: string, updates: Partial<Omit<OpinionDraft, 'id' | 'createdAt'>>) {
      const draftIndex = this.drafts.findIndex(draft => draft.id === id)
      
      if (draftIndex !== -1) {
        const updatedDraft = {
          ...this.drafts[draftIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        }

        // Update slug if title changed
        if (updates.title) {
          updatedDraft.slug = this.generateSlug(updates.title)
        }

        this.drafts[draftIndex] = updatedDraft
        this.saveDraftsToStorage()

        // Update current draft if it's the one being edited
        if (this.currentDraft?.id === id) {
          this.currentDraft = updatedDraft
        }

        return updatedDraft
      }
      
      return null
    },

    // Delete a draft
    deleteDraft(id: string) {
      const draftIndex = this.drafts.findIndex(draft => draft.id === id)
      
      if (draftIndex !== -1) {
        this.drafts.splice(draftIndex, 1)
        this.saveDraftsToStorage()

        // Clear current draft if it was deleted
        if (this.currentDraft?.id === id) {
          this.currentDraft = null
        }

        return true
      }
      
      return false
    },

    // Set current draft
    setCurrentDraft(draft: OpinionDraft | null) {
      this.currentDraft = draft
    },

    // Load a specific draft by ID
    loadDraft(id: string) {
      const draft = this.getDraftById(id)
      if (draft) {
        this.currentDraft = draft
        return draft
      }
      return null
    },

    // Clear all drafts (with confirmation)
    clearAllDrafts() {
      this.drafts = []
      this.currentDraft = null
      this.saveDraftsToStorage()
    },

    // Auto-save current draft
    autoSaveDraft(content: string, title?: string) {
      if (this.currentDraft) {
        const updates: Partial<OpinionDraft> = { content }
        if (title && title !== this.currentDraft.title) {
          updates.title = title
        }
        
        this.updateDraft(this.currentDraft.id, updates)
      }
    },

    // Generate URL-friendly slug from title
    generateSlug(title: string): string {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50) // Limit slug length
    },

    // Export drafts (for backup)
    exportDrafts() {
      return JSON.stringify(this.drafts, null, 2)
    },

    // Import drafts (for restore)
    importDrafts(draftsJson: string) {
      try {
        const importedDrafts = JSON.parse(draftsJson)
        if (Array.isArray(importedDrafts)) {
          this.drafts = importedDrafts
          this.saveDraftsToStorage()
          return true
        }
      } catch (error) {
        console.error('Error importing drafts:', error)
      }
      return false
    }
  }
}) 