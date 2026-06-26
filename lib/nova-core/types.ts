export type NovaCoreIntent =
  | 'addExpense'
  | 'addIncome'
  | 'addTransfer'
  | 'createGoal'
  | 'queryBalance'
  | 'queryAccounts'
  | 'queryMovements'
  | 'monthlySummary'
  | 'knowledgeQuestion'
  | 'financialAdvice'
  | 'unknown'

export type NovaCoreResult = {
  text: string
  intent: NovaCoreIntent
  data: Record<string, unknown> | null
  source: 'nova-core'
}

export type ParsedEntities = {
  amount?: number
  category?: string
  title?: string
  accountFrom?: string
  accountTo?: string
  accountName?: string
  period?: string
  goalName?: string
  goalAmount?: number
}

export type MatchResult = {
  matched: boolean
  intent: NovaCoreIntent
  entities: ParsedEntities
  confidence: number
}
