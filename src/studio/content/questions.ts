import type { L10n } from './setups'

export type QuizType = 'bool' | 'single' | 'multiple'

export type Question = {
  id: string
  type: QuizType
  question: L10n
  options?: L10n[]
  answer: boolean | number | number[]
  correctFeedback: L10n
  wrongFeedback: L10n
}

const t = (fr: string, en: string): L10n => ({ fr, en })

export const knowledgeBySetup: Record<string, L10n[]> = {
  rembrandt: [
    t('Le petit triangle de lumière sous l’œil est appelé « triangle de Rembrandt », du nom du peintre hollandais.', 'The small triangle of light under the eye is called the “Rembrandt triangle”, after the Dutch painter.'),
    t('En Rembrandt, placez la principale à ~45° et légèrement au-dessus des yeux : l’ombre du nez crée le triangle.', 'For Rembrandt, place the key at ~45° and slightly above eye level: the nose shadow forms the triangle.'),
    t('Le Rembrandt affine un visage rond et lui apporte du volume.', 'Rembrandt slims a round face and gives it volume.'),
    t('Un remplissage doux côté ombre évite de perdre le détail dans les ombres profondes.', 'A soft fill on the shadow side keeps detail in the deep shadows.'),
  ],
  butterfly: [
    t('Butterfly tire son nom de l’ombre « papillon » dessinée sous le nez par une source haute et centrée.', 'Butterfly is named after the butterfly-shaped shadow a high, centred source draws under the nose.'),
    t('Prisé dans le portrait glamour des années 1940, Butterfly est aussi appelé « Paramount lighting ».', 'Popular in 1940s Hollywood glamour portraits, Butterfly is also called “Paramount lighting”.'),
    t('Plus la source est haute, plus l’ombre papillon s’allonge sous le nez.', 'The higher the source, the longer the butterfly shadow under the nose.'),
    t('L’ombre papillon raccourcit quand le sujet relève le menton vers la source.', 'The butterfly shadow gets shorter when the subject lifts their chin towards the source.'),
  ],
  loop: [
    t('Loop est un Rembrandt « raccourci » : l’ombre du nez forme une boucle qui ne rejoint pas la joue.', 'Loop is a “shortened” Rembrandt: the nose shadow forms a loop that does not reach the cheek.'),
    t('L’angle d’environ 30° du Loop donne un rendu naturel, très facile à photographier.', 'Loop’s ~30° angle gives a natural look that is very easy to shoot.'),
    t('En Loop, l’ombre du nez reste courte et tombe du côté opposé à la source, légèrement vers le bas.', 'In Loop, the nose shadow stays short and falls on the side away from the source, slightly downwards.'),
    t('Loop est l’un des schémas les plus flatteurs pour les portraits en général.', 'Loop is one of the most flattering patterns for portraits in general.'),
  ],
  split: [
    t('Split coupe le visage en deux : un côté éclairé, un côté à l’ombre, pour un résultat dramatique.', 'Split cuts the face in two: one side lit, one in shadow, for a dramatic result.'),
    t('La source Split se place autour de 90° de l’axe caméra.', 'The Split source sits around 90° from the camera axis.'),
    t('Split accentue le relief et le mystère d’un portrait.', 'Split emphasises the texture and mystery of a portrait.'),
    t('On adoucit Split avec un faible remplissage si l’on veut garder un peu de détail côté ombre.', 'Soften Split with a weak fill if you want to keep some detail on the shadow side.'),
  ],
  broad: [
    t('Broad éclaire la partie large du visage : il « ouvre » les visages étroits.', 'Broad lights the wide side of the face: it “opens up” narrow faces.'),
    t('En Broad, la lumière tombe sur le côté du visage le plus proche de l’appareil.', 'In Broad lighting, the light falls on the side of the face closest to the camera.'),
    t('Ici, la Vénus a la tête tournée vers la droite de l’image : son côté large est à gauche.', 'Here, Venus has her head turned to the right of the frame: her broad side is on the left.'),
    t('Broad réduit les ombres du côté proche : le rendu est plus doux.', 'Broad reduces shadows on the near side: the result is gentler.'),
  ],
  short: [
    t('Short éclaire la partie étroite du visage : idéal pour affiner un visage rond.', 'Short lights the narrow side of the face: ideal for slimming a round face.'),
    t('La lumière short vient du côté vers lequel le visage se détourne de l’appareil.', 'Short light comes from the side the face turns towards, away from the camera.'),
    t('Short est plus dramatique que Broad : l’ombre domine le côté proche de la caméra.', 'Short is more dramatic than Broad: shadow dominates the side nearest the camera.'),
    t('Short éclaircit la joue éloignée : le visage paraît plus sculpté.', 'Short brightens the far cheek: the face looks more sculpted.'),
  ],
  clamshell: [
    t('Clamshell = deux sources « en coquille » qui encadrent le visage : une haute, une sous le menton.', 'Clamshell = two sources framing the face like a shell: one high, one under the chin.'),
    t('Le clamshell est le champion du portrait beauté : il défait les ombres du nez et du cou.', 'Clamshell is the beauty-portrait champion: it opens up nose and neck shadows.'),
    t('En clamshell, une petite rotation de tête du sujet allonge ou raccourcit l’ombre sous le nez.', 'In clamshell, a small head turn lengthens or shortens the shadow under the nose.'),
    t('La source basse est souvent, dans un vrai studio, un réflecteur ou une boîte de remplissage au sol.', 'In a real studio, the lower source is often a reflector or a fill box on the floor.'),
  ],
  threepoint: [
    t('Le schéma trois points est la base du portrait vidéo et studio : principale, remplissage, contre-jour.', 'Three-point lighting is the basis of studio and video portraits: key, fill and rim.'),
    t('Le contre-jour se place derrière le sujet : il dessine un liseré lumineux sur les cheveux et les épaules.', 'The rim light sits behind the subject: it draws a bright edge on the hair and shoulders.'),
    t('Sans contre-jour, un sujet sombre se confond avec un fond sombre. Avec, il s’en détache.', 'Without a rim light, a dark subject blends into a dark background. With one, it pops out.'),
    t('Une stripbox est idéale en contre-jour : longue et étroite, elle suit la silhouette sans déborder.', 'A stripbox is ideal as a rim light: long and narrow, it follows the silhouette without spilling.'),
  ],
}

export const questionsBySetup: Record<string, Question[]> = {
  rembrandt: [
    { id: 'rt1', type: 'bool', question: t('En éclairage Rembrandt, on recherche un petit triangle de lumière sous l’œil opposé à la source.', 'In Rembrandt lighting, we look for a small triangle of light under the eye opposite the source.'), answer: true, correctFeedback: t('Exact : ce triangle lumineux sous l’œil est la signature du schéma.', 'Right: that triangle of light under the eye is the pattern’s signature.'), wrongFeedback: t('C’est bien ce triangle sous l’œil opposé qui caractérise Rembrandt.', 'It is precisely that triangle under the far eye that defines Rembrandt.') },
    { id: 'rt2', type: 'single', question: t('À quel angle se place généralement la principale dans un schéma Rembrandt ?', 'At what angle is the key usually placed for Rembrandt?'), options: [t('0° (pile en face)', '0° (straight on)'), t('Environ 45°', 'About 45°'), t('90° (perpendiculaire)', '90° (side on)'), t('180° (contre-jour)', '180° (from behind)')], answer: 1, correctFeedback: t('Environ 45°, légèrement au-dessus du sujet pour modeler le visage.', 'About 45°, slightly above the subject to shape the face.'), wrongFeedback: t('La source Rembrandt se place autour de 45° par rapport à l’axe caméra.', 'The Rembrandt source sits around 45° from the camera axis.') },
    { id: 'rt3', type: 'single', question: t('Qu’est-ce qui crée le triangle lumineux du Rembrandt ?', 'What creates the Rembrandt triangle?'), options: [t('Le choix du modeleur', 'The choice of modifier'), t('La position de la source (≈ 45° et au-dessus des yeux)', 'The source position (≈ 45° and above eye level)'), t('La puissance de la lampe', 'The power of the light')], answer: 1, correctFeedback: t('C’est la position de la source qui fait tomber l’ombre du nez sur la joue ; le modeleur ne fait que durcir ou adoucir ses bords.', 'The source position makes the nose shadow fall onto the cheek; the modifier only hardens or softens its edges.'), wrongFeedback: t('Le triangle vient de la position de la source : ≈ 45° et au-dessus des yeux, l’ombre du nez rejoint celle de la joue.', 'The triangle comes from the source position: at ≈ 45° and above the eyes, the nose shadow meets the cheek shadow.') },
  ],
  butterfly: [
    { id: 'bt1', type: 'bool', question: t('L’ombre « papillon » sous le nez apparaît quand la source est placée haut et en face du sujet.', 'The butterfly shadow under the nose appears when the source is high and in front of the subject.'), answer: true, correctFeedback: t('Correct : source frontale, haute et centrée = ombre papillon.', 'Correct: frontal, high and centred source = butterfly shadow.'), wrongFeedback: t('L’ombre papillon vient d’une source placée haut et bien en face du sujet.', 'The butterfly shadow comes from a source placed high and right in front of the subject.') },
    { id: 'bt2', type: 'single', question: t('Dans le schéma Butterfly, la source se place à quelle hauteur ?', 'How high is the source placed for Butterfly?'), options: [t('Sous le menton', 'Below the chin'), t('À hauteur des yeux', 'At eye level'), t('Haute, au-dessus de l’axe de la caméra', 'High, above the camera axis')], answer: 2, correctFeedback: t('La source est haute et descend vers le visage, créant l’ombre sous le nez.', 'The source is high and points down at the face, creating the shadow under the nose.'), wrongFeedback: t('Butterfly demande une source haute, au-dessus de l’axe caméra.', 'Butterfly needs a high source, above the camera axis.') },
    { id: 'bt3', type: 'multiple', question: t('Quels éléments sont caractéristiques du schéma Butterfly ?', 'Which features are typical of Butterfly lighting?'), options: [t('Source frontale centrée', 'Centred frontal source'), t('Source à 90° du sujet', 'Source at 90° to the subject'), t('Ombre papillon sous le nez', 'Butterfly shadow under the nose'), t('Source haute', 'High source')], answer: [0, 2, 3], correctFeedback: t('Frontale, centrée, haute… et pas à 90°.', 'Frontal, centred, high… and not at 90°.'), wrongFeedback: t('Butterfly = source frontale, centrée et haute, avec l’ombre papillon sous le nez.', 'Butterfly = frontal, centred and high source, with the butterfly shadow under the nose.') },
  ],
  loop: [
    { id: 'lp1', type: 'bool', question: t('En Loop, l’ombre du nez doit rejoindre l’ombre de la joue.', 'In Loop lighting, the nose shadow should meet the cheek shadow.'), answer: false, correctFeedback: t('C’est l’inverse : l’ombre du nez forme une petite boucle sans atteindre la joue.', 'It’s the opposite: the nose shadow forms a small loop without reaching the cheek.'), wrongFeedback: t('En Loop, l’ombre du nez reste détachée de l’ombre de la joue.', 'In Loop, the nose shadow stays separate from the cheek shadow.') },
    { id: 'lp2', type: 'single', question: t('L’angle de la principale en Loop est environ de :', 'The key angle for Loop is roughly:'), options: [t('0–10° (frontal)', '0–10° (frontal)'), t('30°', '30°'), t('90°', '90°')], answer: 1, correctFeedback: t('Environ 30°, entre Butterfly et Rembrandt.', 'About 30°, between Butterfly and Rembrandt.'), wrongFeedback: t('Loop se situe aux alentours de 30°.', 'Loop sits at around 30°.') },
    { id: 'lp3', type: 'single', question: t('Par rapport au Rembrandt, la source Loop est placée :', 'Compared with Rembrandt, the Loop source is placed:'), options: [t('Plus frontale (moins à l’écart)', 'More frontal (closer to the camera axis)'), t('Plus à 90°', 'Closer to 90°'), t('Exactement à la même place', 'In exactly the same place')], answer: 0, correctFeedback: t('Loop est un Rembrandt légèrement plus frontal : l’ombre du nez reste courte.', 'Loop is a slightly more frontal Rembrandt: the nose shadow stays short.'), wrongFeedback: t('Loop est plus frontale que Rembrandt, d’où une boucle courte.', 'Loop is more frontal than Rembrandt, hence the short loop.') },
  ],
  split: [
    { id: 'sp1', type: 'bool', question: t('Dans Split, une moitié du visage est éclairée et l’autre reste à l’ombre, avec la source presque à 90°.', 'In Split, one half of the face is lit and the other stays in shadow, with the source at almost 90°.'), answer: true, correctFeedback: t('Correct : la source à 90° divise le visage en deux.', 'Correct: a source at 90° divides the face in two.'), wrongFeedback: t('C’est bien le principe : source à ~90° = visage coupé en deux.', 'That is the principle: source at ~90° = face cut in two.') },
    { id: 'sp2', type: 'single', question: t('Quel modeleur accentue le mieux la coupure franche du Split ?', 'Which modifier best emphasises the hard line of Split?'), options: [t('Parapluie blanc', 'White umbrella'), t('Grande softbox', 'Large softbox'), t('Source petite et dure (réflecteur nu, snoot)', 'Small, hard source (bare reflector, snoot)')], answer: 2, correctFeedback: t('Plus la source est petite par rapport au sujet, plus la limite entre lumière et ombre est nette.', 'The smaller the source relative to the subject, the sharper the line between light and shadow.'), wrongFeedback: t('Une source petite et dure donne la transition franche du Split ; les grandes sources l’adoucissent.', 'A small, hard source gives Split its sharp transition; large sources soften it.') },
    { id: 'sp3', type: 'multiple', question: t('Le schéma Split convient particulièrement pour :', 'Split lighting is especially suited to:'), options: [t('Un rendu dramatique', 'A dramatic look'), t('Adoucir toutes les ombres', 'Softening all shadows'), t('Éclairer une seule moitié du visage', 'Lighting only half of the face'), t('Une source placée autour de 90°', 'A source placed at around 90°')], answer: [0, 2, 3], correctFeedback: t('Dramatique, à 90°, une moitié éclairée : tout est bon !', 'Dramatic, at 90°, one half lit: all correct!'), wrongFeedback: t('Split = source à ~90°, une moitié du visage éclairée, rendu dramatique.', 'Split = source at ~90°, half of the face lit, dramatic look.') },
  ],
  broad: [
    { id: 'bd1', type: 'single', question: t('« Broad lighting » éclaire le côté du visage :', 'Broad lighting lights the side of the face that is:'), options: [t('Le plus tourné vers la caméra', 'Turned most towards the camera'), t('Le plus éloigné de la caméra', 'Furthest from the camera'), t('L’arrière de la tête', 'The back of the head')], answer: 0, correctFeedback: t('Broad éclaire la partie la plus visible du visage.', 'Broad lights the most visible part of the face.'), wrongFeedback: t('Broad = la lumière tombe sur le côté du visage le plus proche de la caméra.', 'Broad = the light falls on the side of the face nearest the camera.') },
    { id: 'bd2', type: 'bool', question: t('Broad lighting est souvent utilisé pour élargir visuellement un visage.', 'Broad lighting is often used to make a face look wider.'), answer: true, correctFeedback: t('Oui : en éclairant la grande partie du visage, il l’« ouvre ».', 'Yes: by lighting the wide side of the face, it “opens it up”.'), wrongFeedback: t('Broad éclaire la large partie du visage tournée vers la caméra, ce qui l’élargit visuellement.', 'Broad lights the wide side facing the camera, which makes the face look wider.') },
    { id: 'bd3', type: 'single', question: t('Quel est l’opposé de Broad lighting ?', 'What is the opposite of Broad lighting?'), options: [t('Split lighting', 'Split lighting'), t('Short lighting', 'Short lighting'), t('Butterfly', 'Butterfly')], answer: 1, correctFeedback: t('Short lighting éclaire au contraire la partie la moins visible.', 'Short lighting lights the least visible side instead.'), wrongFeedback: t('L’antithèse de Broad est le Short lighting.', 'The opposite of Broad is Short lighting.') },
  ],
  short: [
    { id: 'st1', type: 'single', question: t('« Short lighting » éclaire le côté du visage :', 'Short lighting lights the side of the face that is:'), options: [t('Le plus proche de la caméra', 'Closest to the camera'), t('Le plus éloigné de la caméra (le moins visible)', 'Furthest from the camera (least visible)'), t('Les deux côtés à la fois', 'Both sides at once')], answer: 1, correctFeedback: t('Short éclaire la partie du visage qui s’éloigne de la caméra.', 'Short lights the side of the face turning away from the camera.'), wrongFeedback: t('Short = la lumière sur le côté le moins visible du visage.', 'Short = light on the least visible side of the face.') },
    { id: 'st2', type: 'bool', question: t('Short lighting a tendance à affiner visuellement le visage.', 'Short lighting tends to make the face look slimmer.'), answer: true, correctFeedback: t('Oui : il plonge le côté visible dans l’ombre, amincissant le visage.', 'Yes: it puts the visible side in shadow, slimming the face.'), wrongFeedback: t('Short creuse les ombres sur le côté visible, ce qui affine le visage.', 'Short deepens the shadows on the visible side, which slims the face.') },
    { id: 'st3', type: 'single', question: t('Avec un sujet légèrement tourné, la source « short » se place du côté :', 'With a slightly turned subject, the short source goes on the side:'), options: [t('De la plus grande partie du visage (comme Broad)', 'Of the wider part of the face (like Broad)'), t('De la partie la moins visible du visage', 'Of the least visible part of the face'), t('Toujours pile derrière le sujet', 'Always right behind the subject')], answer: 1, correctFeedback: t('La source éclaire la partie du visage qui se détourne de la caméra.', 'The source lights the part of the face turning away from the camera.'), wrongFeedback: t('Short place la lumière sur la partie du visage qui se détourne de la caméra.', 'Short puts the light on the part of the face turning away from the camera.') },
  ],
  clamshell: [
    { id: 'cl1', type: 'bool', question: t('Clamshell dispose deux sources « en coquille » : une au-dessus et une sous le visage.', 'Clamshell uses two sources like a shell: one above and one below the face.'), answer: true, correctFeedback: t('Correct : les deux sources forment une coquille autour du visage.', 'Correct: the two sources form a shell around the face.'), wrongFeedback: t('Clamshell = une source haute et une source plus basse, encadrant le visage.', 'Clamshell = one high source and one lower source, framing the face.') },
    { id: 'cl2', type: 'single', question: t('Clamshell sert principalement à :', 'Clamshell is mainly used to:'), options: [t('Lisser les ombres du visage (portrait beauté)', 'Smooth facial shadows (beauty portraits)'), t('Créer des ombres très marquées', 'Create very strong shadows'), t('Éclairer uniquement le fond', 'Light only the background')], answer: 0, correctFeedback: t('Le double éclairage ouvre les ombres et défait les creux du visage.', 'The double source opens up shadows and fills the hollows of the face.'), wrongFeedback: t('Clamshell est prisé en portrait beauté pour adoucir les ombres.', 'Clamshell is popular in beauty portraits for softening shadows.') },
    { id: 'cl3', type: 'multiple', question: t('Quelles affirmations correspondent au Clamshell ?', 'Which statements describe Clamshell?'), options: [t('Une source sous le visage', 'A source below the face'), t('Une seule source très haute', 'A single very high source'), t('Ombre papillon fortement atténuée', 'Butterfly shadow strongly reduced'), t('Très utilisé en portrait beauté', 'Widely used in beauty portraits')], answer: [0, 2, 3], correctFeedback: t('Source sous le visage, ombre papillon atténuée, usage beauté : bravo !', 'Source under the face, reduced butterfly shadow, beauty use: well done!'), wrongFeedback: t('Clamshell : source haute + source sous le visage, ombre papillon atténuée, usage beauté.', 'Clamshell: high source + source under the face, reduced butterfly shadow, beauty use.') },
  ],
  threepoint: [
    { id: 'tp1', type: 'single', question: t('Où se place le contre-jour dans un schéma trois points ?', 'Where does the rim light go in three-point lighting?'), options: [t('À côté de la caméra', 'Next to the camera'), t('Derrière le sujet, en face de la caméra', 'Behind the subject, facing the camera'), t('Au sol, sous le visage', 'On the floor, below the face')], answer: 1, correctFeedback: t('Placé derrière le sujet, il éclaire ses contours et le détache du fond.', 'Placed behind the subject, it lights the edges and separates them from the background.'), wrongFeedback: t('Le contre-jour se place derrière le sujet, orienté vers la caméra.', 'The rim light goes behind the subject, pointing towards the camera.') },
    { id: 'tp2', type: 'bool', question: t('Le contre-jour sert surtout à détacher le sujet du fond.', 'The rim light is mainly there to separate the subject from the background.'), answer: true, correctFeedback: t('Oui : le liseré lumineux dessine la silhouette.', 'Yes: the bright edge outlines the silhouette.'), wrongFeedback: t('Si : son rôle principal est de séparer le sujet du fond.', 'It is: its main job is separating the subject from the background.') },
    { id: 'tp3', type: 'multiple', question: t('Quelles sont les trois sources du schéma trois points ?', 'What are the three sources of three-point lighting?'), options: [t('Principale', 'Key'), t('Remplissage', 'Fill'), t('Flash cobra', 'Speedlight on camera'), t('Contre-jour', 'Rim')], answer: [0, 1, 3], correctFeedback: t('Principale, remplissage et contre-jour : le trio classique.', 'Key, fill and rim: the classic trio.'), wrongFeedback: t('Le trio est : principale, remplissage et contre-jour.', 'The trio is: key, fill and rim.') },
  ],
}
