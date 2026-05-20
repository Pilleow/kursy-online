import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VideoBlock } from '../blocks/VideoBlock'

export const VideoNode = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      uploadId: { default: null },
      jobId: { default: null },
      status: { default: 'idle' },
      videoUrl: { default: null },
      thumbnail: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: '[data-type="video-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'video-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoBlock)
  },
})
