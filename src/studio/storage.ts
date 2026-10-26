import type { Lang } from './i18n'

// Seule la langue choisie est retenue d'une visite à l'autre : la progression
// (étoiles, questions, défis) repart de zéro à chaque chargement de la page.
const LANG_KEY = 'studio-light-lab:lang'
const LEGACY_PROGRESS_KEY = 'studio-light-lab:v2'

export function loadLang(): Lang | undefined {
  try {
    window.localStorage.removeItem(LEGACY_PROGRESS_KEY) // ancienne sauvegarde de progression
    const value = window.localStorage.getItem(LANG_KEY)
    return value === 'fr' || value === 'en' ? value : undefined
  } catch {
    return undefined
  }
}

export function saveLang(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_KEY, lang)
  } catch {
    // navigation privée ou stockage bloqué : la langue reste celle du navigateur
  }
}

export type HelpLevel = 'guided' | 'independent' | 'expert'
const LEVEL_KEY = 'studio-light-lab:level'

export function loadLevel(): HelpLevel {
  try {
    const value = window.localStorage.getItem(LEVEL_KEY)
    return value === 'independent' || value === 'expert' ? value : 'guided'
  } catch {
    return 'guided'
  }
}

export function saveLevel(level: HelpLevel) {
  try { window.localStorage.setItem(LEVEL_KEY, level) } catch { /* stockage indisponible */ }
}
