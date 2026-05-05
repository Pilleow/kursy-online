import { create } from 'zustand'
import type { Block } from '@/lib/types/lesson'

// Keyboard shortcut registration happens in the editor component:
//   Cmd+Z       → undo()
//   Cmd+Shift+Z → redo()

const HISTORY_LIMIT = 50

type EditorState = {
  blocks: Block[]
  past: Block[][]
  future: Block[][]
  isDragging: boolean
  selectedLessonId: string | null
}

type EditorActions = {
  setBlocks: (blocks: Block[]) => void
  undo: () => void
  redo: () => void
  setDragging: (isDragging: boolean) => void
  setSelectedLesson: (id: string | null) => void
}

export const useEditorStore = create<EditorState & EditorActions>()((set) => ({
  blocks: [],
  past: [],
  future: [],
  isDragging: false,
  selectedLessonId: null,

  setBlocks: (blocks) =>
    set((state) => ({
      past: [...state.past, state.blocks].slice(-HISTORY_LIMIT),
      future: [],
      blocks,
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        future: [state.blocks, ...state.future],
        blocks: previous,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        past: [...state.past, state.blocks].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        blocks: next,
      }
    }),

  setDragging: (isDragging) => set({ isDragging }),

  setSelectedLesson: (id) => set({ selectedLessonId: id }),
}))

export const useCanUndo = () => useEditorStore((s) => s.past.length > 0)
export const useCanRedo = () => useEditorStore((s) => s.future.length > 0)
