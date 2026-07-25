import { createContext } from 'react'

// The path of the page being rendered, provided by the SSG (scripts/render.js)
// so Layout can mark the active nav link with aria-current.
export const PathContext = createContext(null)
