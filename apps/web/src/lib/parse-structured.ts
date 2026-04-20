/**
 * Parse a streaming AI response into labeled sections.
 * Our prompts use **Section Name** as headers. This splits on those.
 *
 * Returns an ordered array of { title, body } — preserves order from input.
 * Leading text before the first header becomes { title: null, body: '...' }.
 *
 * The `icon` field is a string key that maps to a lucide-react icon in
 * StructuredResponse — we avoid emoji so the UI reads as polished, not cute.
 */
export type SectionIcon =
  | 'target'
  | 'check'
  | 'alert'
  | 'brain'
  | 'footprints'
  | 'pause'
  | 'bandage'
  | 'repeat'
  | 'timer'
  | 'help'
  | 'stop'
  | 'bell'
  | 'search'
  | 'heart'
  | 'ban'
  | 'calendar'
  | 'tag'
  | 'clipboard'

export type ParsedSection = {
  title: string | null
  body: string
  icon?: SectionIcon
}

const SECTION_ICON: Record<string, SectionIcon> = {
  // Decide (spec COYL_system_behavior_rules \u00a76)
  'What\'s happening': 'target',
  'What is happening': 'target',
  'Prediction': 'alert',
  'Your excuse': 'brain',
  'Best move': 'check',
  'Next action': 'footprints',

  // Rescue (spec \u00a76)
  'Pattern name': 'search',
  'Callout': 'brain',
  'Interrupt': 'stop',
  'Action': 'footprints',
  'Follow-up': 'bell',

  // Slip recovery (spec \u00a76)
  'Acknowledge slip': 'heart',
  'Stop spiral': 'stop',
  'Stabilize': 'bandage',
  'Next move': 'footprints',
  'Tomorrow plan': 'calendar',

  // Legacy aliases kept for backward compatibility with any in-flight
  // responses that still use the previous section names. Safe to keep
  // \u2014 they map to sensible icons even if the header is retired.
  'What you\'re actually deciding': 'target',
  'What you are actually deciding': 'target',
  'Cost of the worse move': 'alert',
  'What the worse move costs': 'alert',
  'The excuse you\'re probably using': 'brain',
  'Likely excuse': 'brain',
  'The excuse': 'brain',
  'Smallest next move': 'footprints',
  'Smallest next action': 'footprints',
  'Next': 'footprints',
  'Pause': 'pause',
  'Least-damaging move right now': 'bandage',
  'Least-damaging move': 'bandage',
  'Replacement move': 'repeat',
  '10-minute delay': 'timer',
  'Delay': 'timer',
  'If you still want it after 10 minutes': 'help',
  'Interruption': 'stop',
  'No shame, no spiral': 'heart',
  'What NOT to do': 'ban',
  'Next 2 hours': 'timer',
  'Next 24 hours': 'calendar',
  'Pattern note': 'search',
  'Name the slip': 'tag',
  'Stop the spiral': 'stop',
  'Smallest stabilizing move': 'bandage',
  'Next rule': 'clipboard',
  'Tomorrow re-entry': 'calendar',
}

export function parseStructuredSections(text: string): ParsedSection[] {
  if (!text || text.trim().length === 0) return []

  // Split on **...** markdown headers (bold)
  const parts: ParsedSection[] = []
  const regex = /\*\*([^*\n]+)\*\*\s*\n/g

  let lastIndex = 0
  let currentTitle: string | null = null
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim()
    if (before) {
      parts.push({
        title: currentTitle,
        body: before,
        icon: currentTitle ? SECTION_ICON[currentTitle] : undefined,
      })
    }
    currentTitle = match[1]?.trim() ?? null
    lastIndex = regex.lastIndex
  }

  // Trailing content after last header
  const tail = text.slice(lastIndex).trim()
  if (tail) {
    parts.push({
      title: currentTitle,
      body: tail,
      icon: currentTitle ? SECTION_ICON[currentTitle] : undefined,
    })
  } else if (currentTitle && parts.length === 0) {
    // Only a header with no body — still show it so streaming feels alive
    parts.push({ title: currentTitle, body: '', icon: SECTION_ICON[currentTitle] })
  }

  return parts
}
