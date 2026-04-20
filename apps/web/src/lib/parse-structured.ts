/**
 * Parse a streaming AI response into labeled sections.
 * Our prompts use **Section Name** as headers. This splits on those.
 *
 * Returns an ordered array of { title, body } — preserves order from input.
 * Leading text before the first header becomes { title: null, body: '...' }.
 */
export type ParsedSection = {
  title: string | null
  body: string
  emoji?: string
}

const SECTION_EMOJI: Record<string, string> = {
  // Decide
  'What you\'re actually deciding': '🎯',
  'What you are actually deciding': '🎯',
  'What\'s actually happening': '🎯',
  'What is actually happening': '🎯',
  'Best move': '✅',
  'Cost of the worse move': '⚠️',
  'What the worse move costs': '⚠️',
  'The excuse you\'re probably using': '🧠',
  'Likely excuse': '🧠',
  'The excuse': '🧠',
  'Smallest next move': '👣',
  'Smallest next action': '👣',
  'Next': '👣',

  // Rescue (note: 'What\'s actually happening' is shared with Decide above)
  'Pause': '⏸️',
  'Least-damaging move right now': '🩹',
  'Least-damaging move': '🩹',
  'Replacement move': '🔁',
  '10-minute delay': '⏱️',
  'Delay': '⏱️',
  'If you still want it after 10 minutes': '🤔',
  'Interrupt': '🛑',
  'Action': '👣',
  'Follow-up': '🔔',
  'Pattern': '🔍',
  'Pattern name': '🔍',
  'Interruption': '🛑',

  // Slip recovery
  'No shame, no spiral': '🫂',
  'What NOT to do': '🚫',
  'Next 2 hours': '⏱️',
  'Next 24 hours': '📅',
  'Pattern note': '🔍',
  'Name the slip': '🏷️',
  'Stop the spiral': '🛑',
  'Smallest stabilizing move': '🩹',
  'Next rule': '📋',
  'Tomorrow re-entry': '📅',
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
        emoji: currentTitle ? SECTION_EMOJI[currentTitle] : undefined,
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
      emoji: currentTitle ? SECTION_EMOJI[currentTitle] : undefined,
    })
  } else if (currentTitle && parts.length === 0) {
    // Only a header with no body — still show it so streaming feels alive
    parts.push({ title: currentTitle, body: '', emoji: SECTION_EMOJI[currentTitle] })
  }

  return parts
}
