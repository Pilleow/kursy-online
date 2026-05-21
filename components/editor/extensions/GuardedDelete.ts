import { Extension } from '@tiptap/core'

const GUARDED_LABELS: Record<string, string> = {
  videoBlock: 'video',
  quizBlock: 'quiz',
  homeworkBlock: 'homework',
}

/**
 * Intercepts Backspace / Delete on atom nodes that carry user data, requiring
 * explicit confirmation before removing them from the document.
 */
export const GuardedDelete = Extension.create({
  name: 'guardedDelete',

  addKeyboardShortcuts() {
    const tryDelete = (): boolean => {
      const { selection, doc } = this.editor.state
      const node = doc.nodeAt(selection.from)

      if (!node || !(node.type.name in GUARDED_LABELS)) return false

      const label = GUARDED_LABELS[node.type.name]!
      const confirmed = window.confirm(
        `Delete this ${label} block? This action cannot be undone.`,
      )
      if (confirmed) {
        this.editor.chain().focus().deleteSelection().run()
      }
      return true // always consume the key so nothing else handles it
    }

    return {
      Backspace: tryDelete,
      Delete: tryDelete,
    }
  },
})
