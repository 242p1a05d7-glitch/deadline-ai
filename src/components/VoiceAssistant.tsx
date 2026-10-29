import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Sparkles, Send, Bot, AlertCircle, Sparkle, Command, Volume2 } from 'lucide-react';

interface VoiceAssistantProps {
  onAddTask: (entities: { title: string; dueDate?: string; priority?: string; duration?: number }) => void;
  onTriggerReplan: (reason: string) => void;
  onGenerateTodayPlan: () => void;
  onViewDeadlines: () => void;
  addSystemLog: (message: string, type: 'info' | 'success' | 'warning') => void;
}

export default function VoiceAssistant({
  onAddTask,
  onTriggerReplan,
  onGenerateTodayPlan,
  onViewDeadlines,
  addSystemLog
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech Recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('Listening for voice commitment...');
      addSystemLog('Microphone listening...', 'info');
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleProcessCommand(text);
    };

    rec.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      setIsListening(false);
      if (err.error === 'not-allowed') {
        addSystemLog('Microphone permission denied. Using text input.', 'warning');
      } else {
        addSystemLog('Speech error. Try text input instead.', 'warning');
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      addSystemLog('Speech recognition not supported in this browser. Please type your command.', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim() || commandText === 'Listening for voice commitment...') return;
    setIsProcessing(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/gemini/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: commandText }),
      });

      if (!res.ok) throw new Error('Failed to parse command');

      const data = await res.json();
      const { intent, entities } = data;

      if (intent === 'add_task') {
        const title = entities.title || 'New Voice Task';
        const priority = entities.priority || 'medium';
        const duration = entities.duration || 60;
        const dueDateRelative = entities.dueDate || 'tomorrow';
        
        onAddTask({ title, dueDate: dueDateRelative, priority, duration });
        setAiResponse(`➕ Added task: "${title}" (${priority} priority) parsed autonomously from your voice instruction.`);
        addSystemLog(`Added task: "${title}" via Voice Command`, 'success');
      } else if (intent === 'check_deadlines') {
        onViewDeadlines();
        setAiResponse(`📅 Analyzed deadlines: Filtering your task board to display upcoming commitments and AI predicted risks.`);
        addSystemLog(`Reviewed Deadlines via Voice Command`, 'info');
      } else if (intent === 'generate_schedule') {
        onGenerateTodayPlan();
        setAiResponse(`⚡ Daily agenda re-optimized. Generated today's critical mission timeline!`);
        addSystemLog(`Generated daily schedule via Voice Command`, 'success');
      } else if (intent === 'replan_schedule') {
        const reason = entities.reason || 'Slipped timeline';
        onTriggerReplan(reason);
        setAiResponse(`🔄 Triggered Replanning: Schedule recalculated. Remaining blocks have been rearranged autonomously due to "${reason}".`);
        addSystemLog(`Dynamic schedule replanned via Voice Command`, 'warning');
      } else {
        setAiResponse(`🤔 I understood: "${commandText}", but could not classify a critical action. Try saying "Add critical task: Design slides", "Show my deadlines", or "Reschedule my day".`);
      }
    } catch (err) {
      console.error(err);
      setAiResponse('⚠️ Error interpreting voice command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="voice-assistant-hub" className="bg-[#111113] border-2 border-accent-tactical rounded-[24px] p-5 relative overflow-hidden shadow-[8px_8px_0px_rgba(0,255,170,0.1)]">
      {/* Hatch pattern layer for tactical style */}
      <div className="absolute inset-0 hatch-pattern opacity-10 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-border-tactical pb-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-accent-tactical border border-accent-tactical/20 rounded-lg text-black font-bold flex items-center justify-center">
            <Bot size={18} className="animate-pulse text-bg-tactical" />
          </div>
          <div>
            <h2 className="font-display font-bold text-ink-tactical text-sm tracking-tight flex items-center gap-1.5 uppercase">
              Voice AI Chief of Staff
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-tactical opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-tactical"></span>
              </span>
            </h2>
            <p className="text-[10px] text-accent-tactical font-mono uppercase tracking-wider font-bold">NATURAL LANGUAGE COGNITION UNIT // LIVE</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-accent-tactical uppercase bg-accent-tactical/5 px-2.5 py-1 rounded border border-accent-tactical/20 font-bold">
          <Command size={10} /> Speak or Type
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
        
        {/* Pulsing microphone control and anim waveform */}
        <div className="flex flex-col items-center gap-2 w-full md:w-auto shrink-0">
          <div className="relative">
            {/* Waveform circles */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-accent-tactical/30 pointer-events-none"
                  />
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.25, opacity: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.7, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-accent-tactical/20 pointer-events-none"
                  />
                </>
              )}
            </AnimatePresence>

            <button
              onClick={toggleListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 cursor-pointer border ${
                isListening
                  ? 'bg-rose-600 text-white shadow-tactical-danger-glow border-rose-500'
                  : 'bg-transparent text-accent-tactical border-accent-tactical hover:bg-accent-tactical/10 shadow-tactical-glow'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
          <span className="text-[10px] font-mono font-bold text-ink-tactical">
            {isListening ? 'STOP' : 'SPEAK'}
          </span>
        </div>

        {/* Console / text feedback with animated EQ Spectrum */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="bg-[#09090b] rounded-xl p-3 border border-border-tactical font-mono text-[11px] text-ink-tactical min-h-[64px] relative flex flex-col justify-between">
            {transcript ? (
              <p className="italic text-ink-tactical font-semibold">"{transcript}"</p>
            ) : (
              <p className="text-ink-muted-tactical italic">"I've completed an autonomous risk audit. Mitigation strategies are active."</p>
            )}
            
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-tactical">
              {/* Mock Audio EQ Spectrum lines when listening */}
              <div className="h-4 flex items-center gap-0.5">
                {isListening ? (
                  [0.6, 0.3, 0.8, 0.5, 0.9, 0.4, 0.7, 0.3, 0.5, 0.8].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['4px', `${h * 16}px`, '4px'] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.06, ease: "easeInOut" }}
                      className="w-[2px] bg-accent-tactical rounded-full"
                    />
                  ))
                ) : (
                  <Volume2 size={10} className="text-ink-muted-tactical" />
                )}
                <span className="text-[9px] text-ink-muted-tactical ml-1 font-bold">
                  {isListening ? 'DECODING AUDIO WAVE' : 'MIC IDLE'}
                </span>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-1.5 text-accent-tactical font-bold">
                  <Sparkles size={11} className="animate-spin" />
                  <span className="text-[9px]">INTERPRETING...</span>
                </div>
              )}
            </div>
          </div>

          {/* Text Input Manual Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('textCommand') as HTMLInputElement).value;
              if (input) {
                setTranscript(input);
                handleProcessCommand(input);
                e.currentTarget.reset();
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              name="textCommand"
              placeholder="COMMAND INSTRUCTION..."
              className="flex-1 bg-transparent border-b border-border-tactical py-2 text-xs text-accent-tactical placeholder-ink-muted-tactical focus:outline-none focus:border-accent-tactical font-mono tracking-wider"
            />
            <button
              type="submit"
              className="bg-accent-tactical hover:bg-[#00e196] text-black font-mono font-bold text-[10px] rounded px-4 flex items-center justify-center transition-all cursor-pointer uppercase"
            >
              <Send size={11} className="mr-1" /> RUN
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {aiResponse && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-4 p-3 bg-accent-tactical/5 border border-accent-tactical/30 rounded-xl flex gap-2.5 relative z-10"
          >
            <Sparkle size={13} className="text-accent-tactical shrink-0 mt-0.5 animate-spin-slow" />
            <p className="text-xs text-ink-tactical font-medium leading-relaxed font-sans">{aiResponse}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
