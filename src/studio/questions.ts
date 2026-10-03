export type QuizType = 'bool' | 'single' | 'multiple'

export type Question = {
  id: string
  type: QuizType
  question: string
  options?: string[]
  answer: boolean | number | number[]
  correctFeedback: string
  wrongFeedback: string
}

export const knowledgeBySetup: Record<string, string[]> = {
  rembrandt: [
    'Le petit triangle de lumière sous l’œil est appelé « triangle de Rembrandt », du nom du peintre hollandais.',
    'En Rembrandt, placez la principale à ~45° et légèrement au-dessus des yeux : l’ombre du nez crée le triangle.',
    'Le Rembrandt affine un visage rond et lui apporte du volume.',
    'Un remplissage doux côté ombre évite de perdre le détail dans les ombres profondes.',
  ],
  butterfly: [
    'Butterfly tire son nom de l’ombre « papillon » dessinée sous le nez par une source haute et centrée.',
    'Prisé dans le portrait glamour des années 1940, Butterfly est aussi appelé « Paramount lighting ».',
    'Plus la source est haute, plus l’ombre papillon s’allonge sous le nez.',
    'L’ombre papillon raccourcit quand le sujet relève le menton vers la source.',
  ],
  loop: [
    'Loop est un Rembrandt « raccourci » : l’ombre du nez forme une boucle qui ne rejoint pas la joue.',
    'L’angle d’environ 30° du Loop donne un rendu naturel, très facile à photographier.',
    'En Loop, une ombre courte suit le nez, côté lumière.',
    'Loop est l’un des schémas les plus flatteurs pour les portraits en général.',
  ],
  split: [
    'Split coupe le visage en deux : un côté éclairé, un côté à l’ombre, pour un résultat dramatique.',
    'La source Split se place autour de 90° de l’axe caméra.',
    'Split accentue le relief et le mystère d’un portrait.',
    'On adoucit Split avec un faible remplissage si l’on veut garder un peu de détail côté ombre.',
  ],
  broad: [
    'Broad éclaire la partie large du visage : il « ouvre » les visages étroits.',
    'En Broad, la lumière tombe sur le côté du visage le plus proche de l’appareil.',
    'Broad est souvent préféré pour les portraits masculins marqués.',
    'Broad réduit les ombres du côté proche : le rendu est plus doux.',
  ],
  short: [
    'Short éclaire la partie étroite du visage : idéal pour affiner un visage rond.',
    'La lumière short vient du côté vers lequel le visage se détourne de l’appareil.',
    'Short est plus dramatique que Broad : l’ombre domine le côté proche de la caméra.',
    'Short éclaircit la joue éloignée : le visage paraît plus sculpté.',
  ],
  clamshell: [
    'Clamshell = deux sources « en coquille » qui encadrent le visage : une haute, une sous le menton.',
    'Le clamshell est le champion du portrait beauté : il défait les ombres du nez et du cou.',
    'En clamshell, une petite rotation de tête du sujet allonge ou raccourcit l’ombre sous le nez.',
    'La source basse est souvent, dans un vrai studio, un réflecteur ou une boîte de remplissage au sol.',
  ],
}

export const questionsBySetup: Record<string, Question[]> = {
  rembrandt: [
    { id: 'rt1', type: 'bool', question: 'En éclairage Rembrandt, on recherche un petit triangle de lumière sous l’œil opposé à la source.', answer: true, correctFeedback: 'Exact : ce triangle lumineux sous l’œil est la signature du schéma.', wrongFeedback: 'Mauvaise réponse : c’est bien ce triangle sous l’œil opposé qui caractérise Rembrandt.' },
    { id: 'rt2', type: 'single', question: 'À quel angle se place généralement la principale dans un schéma Rembrandt ?', options: ['0° (pile en face)', 'Environ 45°', '90° (perpendiculaire)', '180° (contre-jour)'], answer: 1, correctFeedback: 'Environ 45°, légèrement au-dessus du sujet pour modeler le visage.', wrongFeedback: 'La source Rembrandt se place autour de 45° par rapport à l’axe caméra.' },
    { id: 'rt3', type: 'single', question: 'Quel modeleur est le plus adapté pour une principale modelante type Rembrandt ?', options: ['Parapluie très diffus', 'Faisceau étroit (Snoot / boîte)', 'Réflecteur très large'], answer: 1, correctFeedback: 'Un faisceau étroit crée la transition d’ombre nette du Rembrandt.', wrongFeedback: 'Le Rembrandt demande un faisceau plutôt étroit pour dessiner le triangle et l’ombre de côté.' },
  ],
  butterfly: [
    { id: 'bt1', type: 'bool', question: 'L’ombre « papillon » sous le nez apparaît quand la source est placée haut et en face du sujet.', answer: true, correctFeedback: 'Correct : source frontale, haute et centrée = ombre papillon.', wrongFeedback: 'Non : l’ombre papillon vient d’une source placée haut et bien en face du sujet.' },
    { id: 'bt2', type: 'single', question: 'Dans le schéma Butterfly, la source se place à quelle hauteur ?', options: ['Sous le menton', 'À hauteur des yeux', 'Haute, au-dessus de l’axe de la caméra'], answer: 2, correctFeedback: 'La source est haute et descend vers le visage, créant l’ombre sous le nez.', wrongFeedback: 'Butterfly demande une source haute, au-dessus de l’axe caméra.' },
    { id: 'bt3', type: 'multiple', question: 'Quels éléments sont caractéristiques du schéma Butterfly ?', options: ['Source frontale centrée', 'Source à 90° du sujet', 'Ombre papillon sous le nez', 'Source haute'], answer: [0, 2, 3], correctFeedback: 'Frontale, centrée, haute… et pas à 90°.', wrongFeedback: 'Butterfly = source frontale, centrée et haute, avec l’ombre papillon sous le nez.' },
  ],
  loop: [
    { id: 'lp1', type: 'bool', question: 'En Loop, l’ombre du nez doit rejoindre l’ombre de la joue.', answer: false, correctFeedback: 'C’est l’inverse : l’ombre du nez forme une petite boucle sans atteindre la joue.', wrongFeedback: 'En Loop l’ombre du nez reste détachée de l’ombre de la joue.' },
    { id: 'lp2', type: 'single', question: 'L’angle de la principale en Loop est environ de :', options: ['0–10° (frontal)', '30°', '90°'], answer: 1, correctFeedback: 'Environ 30°, entre Butterfly et Rembrandt.', wrongFeedback: 'Loop se situe aux alentours de 30°.' },
    { id: 'lp3', type: 'single', question: 'La source Loop est placée plutôt par rapport à Rembrandt :', options: ['Plus frontale (moins à l’écart)', 'Plus à 90°', 'Exactement à la même place'], answer: 0, correctFeedback: 'Loop est un Rembrandt légèrement plus frontal : l’ombre du nez reste courte.', wrongFeedback: 'Loop est plus frontale que Rembrandt, d’où une boucle courte.' },
  ],
  split: [
    { id: 'sp1', type: 'bool', question: 'Dans Split, une moitié du visage est éclairée et l’autre reste à l’ombre, avec la source presque à 90°.', answer: true, correctFeedback: 'Correct : la source à 90° divise le visage en deux.', wrongFeedback: 'C’est bien le principe : source à ~90° = visage coupé en deux.' },
    { id: 'sp2', type: 'single', question: 'Quel modeleur accentue le mieux la coupure franche du Split ?', options: ['Parapluie blanc', 'Grande softbox', 'Faisceau étroit (Stripbox)'], answer: 2, correctFeedback: 'Un faisceau étroit donne une ligne d’ombre nette au milieu du visage.', wrongFeedback: 'Un faisceau étroit (Stripbox) produit la transition franche du Split.' },
    { id: 'sp3', type: 'multiple', question: 'Le schéma Split convient particulièrement pour :', options: ['Un rendu dramatique', 'Adoucir toutes les ombres', 'Éclairer une seule moitié du visage', 'Une source placée autour de 90°'], answer: [0, 2, 3], correctFeedback: 'Dramatique, à 90°, une moitié éclairée : tout est bon !', wrongFeedback: 'Split = source à ~90°, une moitié du visage éclairée, rendu dramatique.' },
  ],
  broad: [
    { id: 'bd1', type: 'single', question: '« Broad lighting » éclaire le côté du visage :', options: ['Le plus tourné vers la caméra', 'Le plus éloigné de la caméra', 'L’arrière de la tête'], answer: 0, correctFeedback: 'Broad éclaire la partie la plus visible du visage.', wrongFeedback: 'Broad = la lumière tombe sur le côté du visage le plus proche de la caméra.' },
    { id: 'bd2', type: 'bool', question: 'Broad lighting est souvent utilisé pour élargir visuellement un visage.', answer: true, correctFeedback: 'Oui : en éclairant la grande partie du visage, il le « ouvre ».', wrongFeedback: 'Broad éclaire la large partie du visage tournée vers la caméra, ce qui l’élargit visuellement.' },
    { id: 'bd3', type: 'single', question: 'Quel est l’opposé de Broad lighting ?', options: ['Split lighting', 'Short lighting', 'Butterfly'], answer: 1, correctFeedback: 'Short lighting éclaire au contraire la partie la moins visible.', wrongFeedback: 'L’antithèse de Broad est le Short lighting.' },
  ],
  short: [
    { id: 'st1', type: 'single', question: '« Short lighting » éclaire le côté du visage :', options: ['Le plus proche de la caméra', 'Le plus éloigné de la caméra (le moins visible)', 'Les deux côtés à la fois'], answer: 1, correctFeedback: 'Short éclaire la partie du visage qui s’éloigne de la caméra.', wrongFeedback: 'Short = la lumière sur le côté le moins visible du visage.' },
    { id: 'st2', type: 'bool', question: 'Short lighting a tendance à affiner visuellement le visage.', answer: true, correctFeedback: 'Oui : il plonge l’autre moitié dans l’ombre, amincissant le visage.', wrongFeedback: 'Short creuse les ombres sur le côté visible, ce qui affûte le visage.' },
    { id: 'st3', type: 'single', question: 'Avec un sujet légèrement tourné, la source « short » se place du côté :', options: ['De la plus grande partie du visage (comme Broad)', 'De la partie la moins visible du visage', 'Toujours pile derrière le sujet'], answer: 1, correctFeedback: 'La source éclaire la partie du visage qui se détourne de la caméra.', wrongFeedback: 'Short place la lumière sur la partie du visage qui se détourne de la caméra.' },
  ],
  clamshell: [
    { id: 'cl1', type: 'bool', question: 'Clamshell dispose deux sources « en coquille » : une au-dessus et une sous le visage.', answer: true, correctFeedback: 'Correct : les deux sources forment une coquille autour du visage.', wrongFeedback: 'Non : Clamshell = une source haute et une source plus basse, encadrant le visage.' },
    { id: 'cl2', type: 'single', question: 'Clamshell sert principalement à :', options: ['Lisser les ombres du visage (portrait beauté)', 'Créer des ombres très marquées', 'Éclairer uniquement le fond'], answer: 0, correctFeedback: 'Le double éclairage ouvre les ombres et défait les creux du visage.', wrongFeedback: 'Clamshell est prisé en portrait beauté pour adoucir les ombres.' },
    { id: 'cl3', type: 'multiple', question: 'Quelles affirmations correspondent au Clamshell ?', options: ['Une source sous le visage', 'Une seule source très haute', 'Ombre papillon fortement atténuée', 'Très utilisé en portrait beauté'], answer: [0, 2, 3], correctFeedback: 'Source basse + prédominance de l’ombre papillon + beauté : bravo !', wrongFeedback: 'Clamshell : source haute + source sous le visage, ombre papillon atténuée, usage beauté.' },
  ],
}