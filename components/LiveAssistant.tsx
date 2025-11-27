import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Loader2, Volume2, X } from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

interface LiveAssistantProps {
  onClose: () => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [volume, setVolume] = useState(0);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Audio Processing
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (disconnectRef.current) {
      // Trying to close session if the API supports it, usually via closing context or simple cleanup
      // The SDK session object usually has a close method or we just stop sending.
    }

    // Stop all scheduled audio
    scheduledSourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    scheduledSourcesRef.current.clear();

    // Close inputs
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        if (!process.env.API_KEY) {
          throw new Error("API Key not found");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Initialize Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = outputAudioContextRef.current!.createGain();
        outputNode.connect(outputAudioContextRef.current!.destination);

        // Get Microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "Você é um assistente de logística experiente chamado 'Roteiro'. Ajude o usuário a organizar frotas, motoristas e ajudantes. Seja conciso, prestativo e fale português do Brasil.",
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              console.log("Session opened");
              setIsConnected(true);

              // Setup Input Processing
              if (!inputAudioContextRef.current || !streamRef.current) return;
              
              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              sourceRef.current = source;
              
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate simple volume for UI
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length) * 10);

                const pcmBlob = createPcmBlob(inputData);
                
                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    }).catch(err => console.error("Send Error:", err));
                }
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                if (!mounted) return;
                
                // Handle Audio Output
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    const ctx = outputAudioContextRef.current;
                    const audioData = base64ToUint8Array(base64Audio);
                    const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
                    
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    
                    // Simple queue logic
                    const currentTime = ctx.currentTime;
                    if (nextStartTimeRef.current < currentTime) {
                        nextStartTimeRef.current = currentTime;
                    }
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    
                    scheduledSourcesRef.current.add(source);
                    source.onended = () => scheduledSourcesRef.current.delete(source);
                }

                // Handle Interruption
                if (msg.serverContent?.interrupted) {
                    scheduledSourcesRef.current.forEach(s => s.stop());
                    scheduledSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            },
            onerror: (e) => {
                console.error("Session Error", e);
                setIsError(true);
            },
            onclose: () => {
                console.log("Session Closed");
                setIsConnected(false);
            }
          }
        });

        sessionPromiseRef.current = sessionPromise;

      } catch (err) {
        console.error("Initialization Error", err);
        setIsError(true);
      }
    };

    startSession();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
            
            <div className="flex flex-col items-center justify-center space-y-8 py-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">Assistente de Logística</h2>
                    <p className="text-slate-500">Converse para tirar dúvidas sobre a rota.</p>
                </div>

                <div className="relative">
                    {/* Ripple effect based on volume */}
                    <div 
                        className="absolute inset-0 bg-blue-500 rounded-full opacity-20 transition-transform duration-75"
                        style={{ transform: `scale(${1 + volume})` }}
                    />
                    <div className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl shadow-lg transition-all duration-300
                        ${isError ? 'bg-red-500' : isConnected ? 'bg-blue-600 animate-pulse-slow' : 'bg-slate-300'}
                    `}>
                        {isError ? (
                           <MicOff size={32} />
                        ) : isConnected ? (
                           <Mic size={32} />
                        ) : (
                           <Loader2 size={32} className="animate-spin text-slate-500" />
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-sm font-medium">
                    {isConnected ? (
                        <span className="text-green-600 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Ouvindo...
                        </span>
                    ) : isError ? (
                        <span className="text-red-500">Erro na conexão</span>
                    ) : (
                        <span className="text-slate-400">Conectando...</span>
                    )}
                </div>
                
                {isConnected && (
                     <div className="bg-slate-50 rounded-lg p-3 w-full text-center text-xs text-slate-500">
                        <Volume2 className="inline-block w-3 h-3 mr-1" />
                        O assistente está pronto. Pergunte sobre tipos de caminhões ou regras de distribuição.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default LiveAssistant;