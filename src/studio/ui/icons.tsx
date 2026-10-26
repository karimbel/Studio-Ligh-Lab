import type { ReactNode, SVGProps } from 'react'

const Icon = ({ children, size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>

/** Buste : tête + épaules. */
export const IconSubject = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="7.5" r="3.6" /><path d="M5 20.5c.6-3.9 3.4-6.3 7-6.3s6.4 2.4 7 6.3" /></Icon>

/** Principale : un soleil, la source qui dessine. */
export const IconKey = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /></Icon>

/** Remplissage : un disque à moitié éclairé, celui qui débouche les ombres. */
export const IconFill = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" opacity=".55" /></Icon>

/** Contre-jour : un liseré autour d'une silhouette. */
export const IconRim = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="8.5" r="3" /><path d="M6.5 19.5c.5-3 2.6-5 5.5-5s5 2 5.5 5" /><path d="M16.6 5.2a5.6 5.6 0 0 1 1.1 6.2M19.6 18.2c-.3-1.6-1-3-2-4" opacity=".7" /></Icon>

export const IconCamera = (p: { size?: number }) => <Icon {...p}><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4Z" /><circle cx="12" cy="13.2" r="3.4" /></Icon>
export const IconCompare = (p: { size?: number }) => <Icon {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M12 3v18" /><path d="M7 15l2.5-3 2 2" /></Icon>
export const IconSheet = (p: { size?: number }) => <Icon {...p}><rect x="3.5" y="4" width="7" height="7" rx="1.2" /><rect x="13.5" y="4" width="7" height="7" rx="1.2" /><rect x="3.5" y="14" width="7" height="6" rx="1.2" /><rect x="13.5" y="14" width="7" height="6" rx="1.2" /></Icon>
export const IconHelp = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .8-1 1.5v.4" /><path d="M12 16.8h.01" /></Icon>
export const IconInfo = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 7.8h.01" /></Icon>
export const IconTarget = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></Icon>
export const IconDownload = (p: { size?: number }) => <Icon {...p}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></Icon>
export const IconEye = (p: { size?: number }) => <Icon {...p}><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></Icon>
export const IconRestart = (p: { size?: number }) => <Icon {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4h4" /></Icon>
export const IconCheck = (p: { size?: number }) => <Icon {...p}><path d="M5 12.5l4.2 4.2L19 7" /></Icon>
export const IconCross = (p: { size?: number }) => <Icon {...p}><path d="M7 7l10 10M17 7 7 17" /></Icon>
export const IconQuestion = (p: { size?: number }) => <Icon {...p}><path d="M4.5 6.5h15v9h-8l-4.5 3.5v-3.5H4.5Z" /><path d="M10.4 9.4a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.5-.7 1" /><path d="M12 13.6h.01" /></Icon>
export const IconChevron = (p: { size?: number }) => <Icon {...p}><path d="M6.5 9.5 12 15l5.5-5.5" /></Icon>
