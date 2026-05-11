import { create } from 'zustand'
import type { Block } from '@/lib/types/lesson'

// Keyboard shortcut registration happens in the editor component:
//   Cmd+Z       → undo()
//   Cmd+Shift+Z → redo()

const HISTORY_LIMIT = 50

// Minimal snapshot for curriculum undo/redo (order + titles only)
export type CurriculumEntry = { id: string; title: string }

type EditorState = {
  blocks: Block[]
  past: Block[][]
  future: Block[][]
  isDragging: boolean
  selectedLessonId: string | null
  // curriculum history
  curriculumModules: CurriculumEntry[]
  curriculumPast: CurriculumEntry[][]
  curriculumFuture: CurriculumEntry[][]
}

type EditorActions = {
  setBlocks: (blocks: Block[]) => void
  undo: () => void
  redo: () => void
  setDragging: (isDragging: boolean) => void
  setSelectedLesson: (id: string | null) => void
  // curriculum
  initCurriculumModules: (entries: CurriculumEntry[]) => void
  pushCurriculumModules: (entries: CurriculumEntry[]) => void
  undoCurriculum: () => void
  redoCurriculum: () => void
}

export const useEditorStore = create<EditorState & EditorActions>()((set) => ({
  blocks: [],
  past: [],
  future: [],
  isDragging: false,
  selectedLessonId: null,
  curriculumModules: [],
  curriculumPast: [],
  curriculumFuture: [],

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

  // Set initial state without touching history (e.g. on server data load)
  initCurriculumModules: (entries) => set({ curriculumModules: entries }),

  // Push current snapshot to past, set new entries as current, clear redo
  pushCurriculumModules: (entries) =>
    set((state) => ({
      curriculumPast: [...state.curriculumPast, state.curriculumModules].slice(-HISTORY_LIMIT),
      curriculumFuture: [],
      curriculumModules: entries,
    })),

  undoCurriculum: () =>
    set((state) => {
      if (state.curriculumPast.length === 0) return state
      const previous = state.curriculumPast[state.curriculumPast.length - 1]
      return {
        curriculumPast: state.curriculumPast.slice(0, -1),
        curriculumFuture: [state.curriculumModules, ...state.curriculumFuture].slice(
          0,
          HISTORY_LIMIT,
        ),
        curriculumModules: previous,
      }
    }),

  redoCurriculum: () =>
    set((state) => {
      if (state.curriculumFuture.length === 0) return state
      const next = state.curriculumFuture[0]
      return {
        curriculumPast: [...state.curriculumPast, state.curriculumModules].slice(-HISTORY_LIMIT),
        curriculumFuture: state.curriculumFuture.slice(1),
        curriculumModules: next,
      }
    }),
}))

export const useCanUndo = () => useEditorStore((s) => s.past.length > 0)
export const useCanRedo = () => useEditorStore((s) => s.future.length > 0)
export const useCanUndoCurriculum = () => useEditorStore((s) => s.curriculumPast.length > 0)
export const useCanRedoCurriculum = () => useEditorStore((s) => s.curriculumFuture.length > 0)
