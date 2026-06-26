import { KNOWLEDGE_ENTRIES } from './knowledge-content'

export interface KnowledgeEntry {
  title: string
  slug: string
  content: string
  keywords: string[]
  category: string
}

export function queryKnowledge(query: string): { answer: string; source: string } | null {
  const n = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const scored = KNOWLEDGE_ENTRIES.map((entry) => {
    let score = 0
    for (const kw of entry.keywords) {
      if (n.includes(kw)) score += 2
    }
    const contentLower = entry.content.toLowerCase()
    const queryWords = n.split(/\s+/).filter((w) => w.length > 3)
    for (const w of queryWords) {
      if (contentLower.includes(w)) score += 1
    }
    return { entry, score }
  })

  const best = scored.sort((a, b) => b.score - a.score)[0]
  if (!best || best.score < 1) return null

  const lines = best.entry.content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  const answer = lines.slice(0, 8).join('\n')
  return {
    answer: answer.length > 900 ? answer.slice(0, 900) + '...' : answer,
    source: best.entry.title,
  }
}
