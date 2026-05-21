import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { HomeworkBlock } from '../blocks/HomeworkBlock'

export const HomeworkNode = Node.create({
  name: 'homeworkBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      homeworkId: { default: null },
      lessonId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: '[data-type="homework-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'homework-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(HomeworkBlock)
  },
})
