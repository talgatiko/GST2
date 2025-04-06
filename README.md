# Voice Bot Interaction Diagram

This diagram illustrates the relationships and interactions between the main components of the Voice Bot application.

```mermaid
classDiagram
    direction LR

    class App {
        +initialize()
        +handleUIEvents()
    }

    class VoiceBot {
        -logger: Logger
        -settings: Settings
        -recognizer: SpeechRecognizer
        -synthesizer: SpeechSynthesizer
        -aiClient: AIClient
        -isActive: boolean
        -currentStage: number
        -waitingPhrasesTimer: Timer
        +initialize()
        +start()
        +stop()
        +processVoiceInput(text)
        +handleAIResponse(response)
        +handleStreamingChunk(chunk, fullText)
        +updateSettings()
        +resetSettings()
        +startWaitingPhrases()
        +stopWaitingPhrases()
        +determineStage(text)
    }

    class Settings {
        +apiKey: string
        +apiUrl: string
        +model: string
        +temperature: number
        +max_tokens: number
        +language: string
        +greetingText: string
        +systemPrompt: string
        +conversationStages: Array
        +waitingPhrases: Array
        +waitingInterval: number
        +useStreaming: boolean
        +load()
        +save()
        +updateFromUI()
        +reset()
    }

    class Logger {
        +log(message, level)
        +clear()
    }

    class SpeechRecognizer {
        +initialize()
        +start()
        +stop()
        +setLanguage(lang)
        +onResult(callback)
        +onError(callback)
    }

    class SpeechSynthesizer {
        +speak(text)
        +stop()
        +setLanguage(lang)
    }

    class AIClient {
        -apiUrl: string
        -apiKey: string
        -model: string
        -temperature: number
        -max_tokens: number
        -supportStreaming: boolean
        +setApiParams(...)
        +sendRequest(text, systemPrompt, logger)
        +sendStreamingRequest(text, systemPrompt, chunkCallback, logger)
        +detectStreamingSupport()
    }

    class DefaultSettings {
        +getDefaults()
    }

    class HTMLElement {
        <<UI>>
        +addEventListener()
        +textContent
        +style
        +value
        +classList
    }

    class BrowserAPI {
        <<External>>
        +SpeechRecognition
        +SpeechSynthesis
        +localStorage
        +fetch / XMLHttpRequest
    }

    App --> VoiceBot : creates & initializes
    App --> Settings : uses (for API key modal)
    App ..> HTMLElement : interacts with (DOM)

    VoiceBot *-- "1" Logger : creates & uses
    VoiceBot *-- "1" Settings : creates & uses
    VoiceBot *-- "1" SpeechRecognizer : creates & uses
    VoiceBot *-- "1" SpeechSynthesizer : creates & uses
    VoiceBot *-- "1" AIClient : creates & uses
    VoiceBot ..> HTMLElement : interacts with (DOM)

    Settings ..> DefaultSettings : uses (for defaults)
    Settings ..> BrowserAPI : uses (localStorage)

    SpeechRecognizer ..> BrowserAPI : uses (SpeechRecognition)
    SpeechSynthesizer ..> BrowserAPI : uses (SpeechSynthesis)
    AIClient ..> BrowserAPI : uses (fetch/XHR for AI API)
