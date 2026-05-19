import { Node, mergeAttributes } from '@tiptap/core'

export const QASectionNode = Node.create({
  name: 'qaSection',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: '[data-type="qa-section"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'qa-section' })]
  },

  addNodeView() {
    return () => {
      const dom = document.createElement('div')
      dom.className =
        'my-2 select-none rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-500 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
      dom.setAttribute('data-type', 'qa-section')
      dom.contentEditable = 'false'
      dom.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
          </svg>
          <span>Q&amp;A Section</span>
        </div>
        <p style="margin-top:4px;font-size:11px;opacity:.65">Students can post and upvote questions here</p>
      `
      return { dom }
    }
  },
})
