import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { QuizBlock } from '../blocks/QuizBlock'

export const QuizNode = Node.create({
  name: 'quizBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      quizId: { default: null },
      lessonId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: '[data-type="quiz-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'quiz-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuizBlock)
  },
})
