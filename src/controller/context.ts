import { createContext, use } from 'react'
import type { GameController } from './GameController'

/** Null for the first render only — the controller needs a mounted canvas. */
export const ControllerContext = createContext<GameController | null>(null)

export const useController = () => use(ControllerContext)
