export interface SpeechResult {
  isFinal: boolean
  0: { transcript: string }
}

export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechConstructor
    webkitSpeechRecognition?: SpeechConstructor
  }
}

export function speechConstructor(): SpeechConstructor | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function speechError(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. You can type or pick a phrase instead.'
    case 'no-speech':
      return 'No speech was recognised. Try again, type, or pick a phrase.'
    case 'audio-capture':
      return 'No working microphone was found. Type or pick a phrase instead.'
    case 'network':
      return 'The speech service could not connect. Voice may need internet; presets and typing still work.'
    case 'aborted':
      return 'Voice input stopped. Your editable text is still available.'
    default:
      return 'Speech recognition could not complete. Please type or use a preset.'
  }
}
