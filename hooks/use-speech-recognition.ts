'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal typings for the Web Speech API (not in standard lib.dom yet).
type SpeechRecognitionResultLike = {
  0: { transcript: string }
  isFinal: boolean
}
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>
}
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type VoiceStatus = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const finalRef = useRef('')

  useEffect(() => {
    setSupported(!!getRecognitionCtor())
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(async () => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setStatus('unsupported')
      return
    }
    setError(null)
    setTranscript('')
    finalRef.current = ''

    // Pre-warm microphone permission so iOS doesn't re-prompt on every launch
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      setStatus('error')
      setError('microphone-denied')
      return
    }

    const recognition = new Ctor()
    recognition.lang = 'es-MX'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      let interim = ''
      let final = finalRef.current
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) final += res[0].transcript
        else interim += res[0].transcript
      }
      finalRef.current = final
      setTranscript((final + interim).trim())
    }
    recognition.onerror = (e) => {
      setError(e.error)
      setStatus('error')
    }
    recognition.onend = () => {
      setStatus((s) => (s === 'error' ? s : 'done'))
    }

    recognitionRef.current = recognition
    setStatus('listening')
    try {
      recognition.start()
    } catch {
      setStatus('error')
      setError('start-failed')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setTranscript('')
    setError(null)
    finalRef.current = ''
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return { supported, status, transcript, error, start, stop, reset }
}
