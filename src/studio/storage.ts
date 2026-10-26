import type { Lang } from './i18n'

export type Progress = {
  quiz: Record<string, number> // bonnes réponses par schéma (2 max comptent)
  challenge: Record<string, boolean> // défi réussi par schéma
  answered: number
  lang?: Lang
  introSeen?: boolean
}

const KEY = 'studio-light-lab:v2'

export function loadProgress(): Partial<Progress> {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return typeof data === 'object' && data ? data : {}
  } catch {
    return {}
  }
}

export function saveProgress(progress: Progress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // navigation privée ou stockage bloqué : la progression reste en mémoire
  }
}
