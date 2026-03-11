import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  time: string;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getMedications(): any[] {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) return [];
    const key = `medicines_${user.id}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function getAdherence(): any[] {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) return [];
    const key = `adherence_${user.id}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function generateResponse(input: string): string {
  const q = input.toLowerCase().trim();
  const meds = getMedications();
  const adherence = getAdherence();

  // Greetings
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|howdy|hiya)\b/.test(q)) {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const name = user?.name ? `, ${user.name}` : '';
    return `Hello${name}! 👋 I'm MedGuide Assistant. I can help you with:\n• Your medication schedule\n• Missed dose guidance\n• Side effect info\n• App navigation\n\nWhat would you like to know?`;
  }

  // What can you do / help
  if (/what can you (do|help)|help me|how (do|can) (i|you)|features|capabilities/.test(q)) {
    return `Here's what I can help with:\n\n💊 **Medications** – List your meds, dosages & schedules\n⏰ **Reminders** – Check when your next dose is due\n⚠️ **Missed doses** – What to do if you miss a dose\n📊 **Adherence** – Your medication stats\n🚨 **Emergency** – When to seek urgent care\n🧭 **Navigation** – How to use MedGuide\n\nJust ask me anything!`;
  }

  // List medications
  if (/\b(list|show|what|my|all|current)\b.*\b(med(ication|icine)?s?|drug|prescription|pill)\b|\b(med(ication|icine)?s?|drug|prescription|pill)\b.*\b(list|show|have|taking|on)\b/.test(q)) {
    if (meds.length === 0) {
      return `You don't have any medications added yet. Head to the **Medications** page to add your first medication.`;
    }
    const list = meds.map((m: any, i: number) => `${i + 1}. ${m.name} — ${m.dosage} (${m.frequency})`).join('\n');
    return `You currently have **${meds.length}** medication(s):\n\n${list}\n\nGo to the Medications page to manage them.`;
  }

  // Reminder / schedule / time to take
  if (/\b(remind|reminder|schedule|when|time|next dose|take my|should i take)\b/.test(q)) {
    if (meds.length === 0) {
      return `You have no medications scheduled. Add your medications on the Medications page to set up reminders.`;
    }
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const upNext = meds
      .filter((m: any) => m.reminder_time)
      .map((m: any) => {
        const [h, min] = m.reminder_time.split(':').map(Number);
        const medMins = h * 60 + min;
        const diff = medMins - currentMins;
        return { ...m, diff };
      })
      .filter((m: any) => m.diff > 0)
      .sort((a: any, b: any) => a.diff - b.diff);

    if (upNext.length === 0) {
      return `No more doses scheduled for today. Check back tomorrow or review your schedule on the Medications page.`;
    }
    const next = upNext[0];
    const hrs = Math.floor(next.diff / 60);
    const mins = next.diff % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`;
    return `⏰ Your next dose is **${next.name}** (${next.dosage}) in **${timeStr}** at ${next.reminder_time}.${upNext.length > 1 ? `\n\nYou have ${upNext.length - 1} more dose(s) scheduled today.` : ''}`;
  }

  // Missed dose
  if (/\b(miss|missed|forgot|forget|skip(ped)?)\b.*\b(dose|med|pill|medication)\b|\b(dose|med|pill|medication)\b.*\b(miss|missed|forgot|forget|skip(ped)?)\b/.test(q)) {
    return `⚠️ **Missed a dose?**\n\n• **If it's close to your scheduled time:** Take it as soon as you remember.\n• **If your next dose is near:** Skip the missed dose — never double-dose.\n• **For critical medications** (e.g. insulin, blood thinners): Contact your doctor immediately.\n\n📌 Log the missed dose on the Dashboard to keep your adherence record accurate.\n\n*Always follow your doctor's specific instructions.*`;
  }

  // Side effects
  if (/\b(side effect|adverse|reaction|symptom|effect(s)?|allerg)\b/.test(q)) {
    if (meds.length > 0) {
      const withEffects = meds.filter((m: any) => m.side_effects);
      if (withEffects.length > 0) {
        const info = withEffects.map((m: any) => `• **${m.name}**: ${m.side_effects}`).join('\n');
        return `⚠️ Known side effects for your medications:\n\n${info}\n\n*Seek medical attention immediately if you experience severe reactions, difficulty breathing, or swelling.*`;
      }
    }
    return `Common medication side effects include nausea, headache, dizziness, and fatigue. Side effect details appear on your Medications page after MedGuide fetches FDA drug data.\n\n⚠️ Seek immediate care for: severe allergic reactions, chest pain, or difficulty breathing.`;
  }

  // Dosage
  if (/\b(dosage|dose|how much|mg|mcg|ml|tablet|capsule)\b/.test(q)) {
    if (meds.length === 0) {
      return `No medications found. Add your medications on the Medications page to track dosages.`;
    }
    const list = meds.map((m: any) => `• **${m.name}**: ${m.dosage}`).join('\n');
    return `💊 Your current dosages:\n\n${list}\n\n*Never change your dosage without consulting your doctor.*`;
  }

  // Adherence / stats
  if (/\b(adherence|stat(s|istic)?|track|record|taken|progress|how (am i|did i))\b/.test(q)) {
    if (adherence.length === 0) {
      return `No adherence records yet. Start logging your doses on the Dashboard — tap **Taken**, **Skipped**, or **Missed** for each medication.`;
    }
    const taken = adherence.filter((a: any) => a.status === 'taken').length;
    const missed = adherence.filter((a: any) => a.status === 'missed').length;
    const skipped = adherence.filter((a: any) => a.status === 'skipped').length;
    const total = adherence.length;
    const pct = Math.round((taken / total) * 100);
    return `📊 **Your adherence summary:**\n\n✅ Taken: ${taken}\n❌ Missed: ${missed}\n⏭️ Skipped: ${skipped}\n\n🎯 Adherence rate: **${pct}%**\n\n${pct >= 80 ? '🌟 Great job keeping up with your medications!' : '💡 Tip: Set reminders to improve your adherence rate.'}`;
  }

  // Emergency
  if (/\b(emergency|urgent|severe|critical|911|ambulance|sos|danger)\b/.test(q)) {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const contactName = user?.emergency_contact_name;
    const contactPhone = user?.emergency_contact_phone;
    let contactInfo = '';
    if (contactName) contactInfo = `\n\n👤 Your emergency contact: **${contactName}**${contactPhone ? ` — ${contactPhone}` : ''}`;
    return `🚨 **Emergency Guidance:**\n\n• Call **911** (or your local emergency number) immediately for life-threatening situations.\n• For medication overdose: call **Poison Control at 1-800-222-1222** (US).\n• Go to the nearest emergency room for severe reactions.${contactInfo}\n\n*You can update your emergency contact in the Settings page.*`;
  }

  // Add medication
  if (/\b(add|new|create|log)\b.*\b(med(ication|icine)?|drug|pill|prescription)\b/.test(q)) {
    return `To add a medication:\n\n1. Click **Medications** in the sidebar\n2. Click the **+ Add Medication** button\n3. Fill in the name, dosage, frequency, and reminder time\n4. Click **Add**\n\nMedGuide will automatically fetch safety info from the FDA database for your medication.`;
  }

  // Delete medication
  if (/\b(delete|remove|stop)\b.*\b(med(ication|icine)?|drug|pill|prescription)\b/.test(q)) {
    return `To remove a medication:\n\n1. Go to the **Medications** page\n2. Find the medication you want to remove\n3. Click the **delete (trash) icon** on that card\n\n*Note: This will permanently remove it along with its associated data.*`;
  }

  // Settings / profile
  if (/\b(setting|profile|account|theme|contrast|elderly|font|mode)\b/.test(q)) {
    return `You can customise your experience in **Settings**:\n\n👤 Update your profile & emergency contact\n🎨 Toggle **High Contrast** mode for better visibility\n🔤 Enable **Elderly Mode** for larger text & buttons\n🔔 Manage notification preferences\n\nFind it in the sidebar or top navigation.`;
  }

  // Dashboard
  if (/\b(dashboard|home|overview|today)\b/.test(q)) {
    return `The **Dashboard** is your daily overview:\n\n📋 See today's medications at a glance\n✅ Log each dose as Taken, Skipped, or Missed\n📊 View your adherence chart\n🔄 Switch between Today and Weekly views\n\nNavigate there using the sidebar.`;
  }

  // Thank you
  if (/\b(thank(s| you)|thanks|ty|thx|great|awesome|perfect|nice|good bot)\b/.test(q)) {
    return `You're welcome! 😊 I'm always here if you have questions about your medications or need help using MedGuide. Stay healthy! 💊`;
  }

  // Goodbye
  if (/\b(bye|goodbye|see you|cya|later|exit|close)\b/.test(q)) {
    return `Goodbye! Take care and don't forget your medications. 💊 Come back anytime!`;
  }

  // Drug interaction
  if (/\b(interact|interaction|combination|mix|together|with)\b.*\b(drug|med|pill|medication)\b|\b(safe|okay|ok)\b.*\b(take|combine|mix)\b/.test(q)) {
    return `⚕️ **Drug Interactions:**\n\nDrug interaction checking requires a pharmacist or doctor. I can't safely evaluate combinations.\n\n**For interaction checks:**\n• Ask your pharmacist — they have access to full interaction databases\n• Use trusted tools like Drugs.com Interaction Checker\n• Always inform your doctor of all medications you take\n\n*Never stop or combine medications without professional guidance.*`;
  }

  // Pregnancy / breastfeeding
  if (/\b(pregnan|breastfeed|nursing|baby|infant|lactation)\b/.test(q)) {
    return `🤰 **Medications during pregnancy/breastfeeding:**\n\nMany medications have specific safety considerations for pregnant or breastfeeding individuals.\n\n• Always consult your **OB-GYN or doctor** before taking any medication\n• Check the **FDA pregnancy category** for your medication\n• Never stop prescribed medications without medical advice\n\n*Your MedGuide medication cards show FDA safety data when available.*`;
  }

  // Storage
  if (/\b(store|storage|keep|refrigerat|temperature|shelf|expire|expir)\b/.test(q)) {
    return `💊 **Medication Storage Tips:**\n\n• Store most tablets/capsules at **room temperature** (59–77°F / 15–25°C)\n• Keep away from **heat, light, and moisture** (avoid bathrooms)\n• Some medications like insulin require **refrigeration** — check your label\n• Keep all medications **out of reach of children**\n• Dispose of expired medications at a **pharmacy take-back program**`;
  }

  // Default / unknown
  return `I'm not sure about that. Here are some things I can help with:\n\n• Type **"my medications"** to see your med list\n• Type **"missed dose"** for guidance\n• Type **"side effects"** for your med side effects\n• Type **"adherence"** for your stats\n• Type **"emergency"** for urgent help\n• Type **"help"** for all options`;
}

const WELCOME: Message = {
  id: 0,
  role: 'bot',
  text: `Hi! I'm **MedBot** 🤖, your MedGuide assistant.\n\nI can help you with your medications, reminders, adherence, and more.\n\nType **"help"** to see everything I can do!`,
  time: getTime(),
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate a short typing delay for natural feel
    setTimeout(() => {
      const botReply: Message = {
        id: Date.now() + 1,
        role: 'bot',
        text: generateResponse(text),
        time: getTime(),
      };
      setMessages(prev => [...prev, botReply]);
      setTyping(false);
      if (!open) setUnread(n => n + 1);
    }, 600 + Math.random() * 400);
  };

  const clearChat = () => setMessages([WELCOME]);

  const renderText = (text: string) => {
    // Simple bold markdown via **text**
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold z-10"
            >
              {unread}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(v => !v)}
          className="w-14 h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-full shadow-2xl shadow-sky-200 flex items-center justify-center transition-colors"
          aria-label="Open MedBot chat assistant"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[99] w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl shadow-sky-100 border border-gray-100 overflow-hidden bg-white"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-sky-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">MedBot</p>
                  <p className="text-sky-100 text-xs">Your medication assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Clear chat"
                  aria-label="Clear chat history"
                >
                  <Trash2 size={16} className="text-white/80" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} className="text-white/80" />
                </button>
              </div>
            </div>

            {/* Online indicator bar */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-1.5 flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-emerald-700 font-medium">Online — always available</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'bot' ? 'bg-sky-100' : 'bg-gray-200'}`}>
                    {msg.role === 'bot' ? <Bot size={14} className="text-sky-600" /> : <User size={14} className="text-gray-600" />}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'bot'
                        ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                        : 'bg-sky-500 text-white rounded-tr-sm'
                    }`}>
                      {renderText(msg.text)}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2 flex-row">
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={14} className="text-sky-600" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-0"></span>
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-300"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
              {['My meds', 'Missed dose', 'Side effects', 'Adherence', 'Emergency'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => { setInput(''); const text = s; const userMsg: Message = { id: Date.now(), role: 'user', text, time: getTime() }; setMessages(prev => [...prev, userMsg]); setTyping(true); setTimeout(() => { const botReply: Message = { id: Date.now() + 1, role: 'bot', text: generateResponse(text), time: getTime() }; setMessages(prev => [...prev, botReply]); setTyping(false); }, 600); }, 0); }}
                  className="whitespace-nowrap text-xs px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full hover:bg-sky-100 transition-colors font-medium border border-sky-100"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about your medications..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
              />
              <button
                onClick={send}
                disabled={!input.trim() || typing}
                className="w-10 h-10 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
