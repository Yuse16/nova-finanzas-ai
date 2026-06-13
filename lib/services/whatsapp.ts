/**
 * WhatsApp integration service (placeholder).
 *
 * Prepares the architecture for a future WhatsApp Business / Cloud API
 * integration where users could text commands like:
 *   "Gasté 200 en tacos"
 *   "¿Cuánto me queda?"
 *   "Recuérdame pagar internet"
 *
 * The parsing logic is shared with the voice system (see lib/parse-voice.ts),
 * so when WhatsApp is connected a webhook handler can reuse `parseVoice`.
 * Nothing is connected yet.
 */

export const WHATSAPP_READY = false

export type WhatsAppIntent = 'register' | 'query' | 'reminder' | 'unknown'

export interface WhatsAppService {
  /** Verify and handle an inbound webhook payload. */
  handleWebhook(payload: unknown): Promise<{ reply: string }>
  /** Send an outbound message to a phone number. */
  sendMessage(to: string, text: string): Promise<void>
}

export function detectIntent(text: string): WhatsAppIntent {
  const t = text.toLowerCase()
  if (/recu[eé]rdame|recordatorio/.test(t)) return 'reminder'
  if (/cu[aá]nto|qu[eé] me queda|saldo|balance/.test(t)) return 'query'
  if (/gast[eé]|pagu[eé]|me pagaron|prest[eé]/.test(t)) return 'register'
  return 'unknown'
}

export function createWhatsAppService(): WhatsAppService {
  return {
    async handleWebhook() {
      throw new Error('WhatsApp no está conectado todavía.')
    },
    async sendMessage() {
      throw new Error('WhatsApp no está conectado todavía.')
    },
  }
}
