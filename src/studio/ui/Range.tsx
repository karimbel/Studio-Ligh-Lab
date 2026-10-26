import type { CSSProperties, InputHTMLAttributes } from 'react'

/** Curseur stylé à l'identique sur tous les navigateurs : la partie remplie suit la valeur via --fill. */
export function Range(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const min = Number(props.min ?? 0)
  const max = Number(props.max ?? 100)
  const value = Number(props.value ?? min)
  const fill = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0
  return <input {...props} type="range" className={`range ${props.className ?? ''}`} style={{ ...props.style, '--fill': `${fill}%` } as CSSProperties} />
}
