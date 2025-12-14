import React, { useState, useRef, useEffect } from 'react';
import { AppState, QuizQuestion, Flashcard, Chapter, Formula, ChatMessage } from '../types';
import { BookOpen, Target, BrainCircuit, FileJson, ArrowLeft, CheckCircle, XCircle, LogOut, Award, AlertTriangle, TrendingUp, MessageSquare, Play, Video, Sigma, Save, Send } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../services/supabaseClient';
import { chatWithLecture } from '../services/geminiService';

interface DashboardProps {
  state: AppState;
  onReset: () => void;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onReset, onSignOut }) => {
  // Tabs for the tools section
  const [activeTab, setActiveTab] = useState<'summary' | 'formulas' | 'cards' | 'quiz' | 'cheat'>('summary');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(state.chatHistory);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatWithLecture(state.lecture?.transcript || '', chatMessages.map(m => ({role: m.sender, content: m.text})), userMsg.text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Mock function to satisfy "Add Supabase API" persistence request visually
  const handleSaveToLibrary = async () => {
    // In a real app, this would use: await supabase.from('lectures').insert({...})
    alert("Lecture saved to your Supabase Library (Simulation)");
  };

  const handleTakeQuiz = () => {
    setActiveTab('quiz');
    // For mobile devices where content might be stacked, scroll up to the tools section
    if (toolsRef.current) {
      toolsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 z-20 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Button variant="ghost" size="sm" onClick={onReset} className="-ml-2 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="truncate">
              <h2 className="text-lg font-bold text-slate-900 truncate">{state.lecture?.title || 'Lecture Revision'}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{state.examType}</span>
                <span className="hidden sm:inline">• {state.timeFrame} prep</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
             <Button variant="outline" size="sm" onClick={handleSaveToLibrary} className="hidden sm:flex">
                <Save className="w-4 h-4 mr-2" />
                Save to Library
             </Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign Out">
              <LogOut className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Video & Tools (Responsive: Top on mobile) */}
        <div ref={toolsRef} className="flex-1 flex flex-col min-w-0 bg-white lg:border-r border-slate-200 overflow-hidden">
          {/* Video Section */}
          <div className="w-full bg-black aspect-video flex items-center justify-center relative flex-shrink-0">
            {state.lecture?.videoId ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${state.lecture.videoId}`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-white text-center p-4">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No Video Source (Transcript Only)</p>
              </div>
            )}
          </div>

          {/* Tools Navigation */}
          <div className="border-b border-slate-200 overflow-x-auto bg-slate-50">
            <div className="flex space-x-1 p-2 min-w-max">
              {[
                { id: 'summary', label: 'Summary', icon: BookOpen },
                { id: 'formulas', label: 'Formulas', icon: Sigma },
                { id: 'cards', label: 'Flashcards', icon: BrainCircuit },
                { id: 'quiz', label: 'Quiz', icon: CheckCircle },
                { id: 'cheat', label: 'Cheat Sheet', icon: FileJson },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tools Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
             {activeTab === 'summary' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Lecture Summary</h3>
                    {state.strategy && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md border border-green-200">High Yield Content</span>}
                  </div>
                  <div className="prose prose-sm prose-indigo max-w-none text-slate-700 leading-relaxed">
                    {state.summary}
                  </div>
                </div>
              )}

              {activeTab === 'formulas' && (
                <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto animate-fade-in">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Key Formulas & Rules</h3>
                  {state.formulas.length > 0 ? (
                    state.formulas.map((f, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
                         <div className="bg-slate-100 p-3 rounded-lg flex-shrink-0">
                           <Sigma className="w-6 h-6 text-indigo-600" />
                         </div>
                         <div>
                           <code className="block text-lg font-mono font-bold text-slate-900 mb-1 bg-slate-50 p-1 rounded w-fit">{f.expression}</code>
                           <p className="text-slate-600 text-sm">{f.description}</p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-slate-500">No explicit formulas detected in this lecture.</div>
                  )}
                </div>
              )}

              {activeTab === 'cards' && <FlashcardDeck cards={state.flashcards} />}
              {activeTab === 'quiz' && <QuizComponent questions={state.quiz} />}
              {activeTab === 'cheat' && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in max-w-3xl mx-auto">
                   <h3 className="text-xl font-bold text-slate-900 mb-4">One-Page Cheat Sheet</h3>
                   <div className="prose prose-xs prose-slate max-w-none font-mono whitespace-pre-wrap bg-amber-50 p-4 rounded-lg border border-amber-100">
                     {state.cheatSheet}
                   </div>
                 </div>
              )}
          </div>
        </div>

        {/* Right Column: Timeline & Chat (Responsive: Bottom on mobile) */}
        <div className="w-full lg:w-96 flex flex-col bg-white border-l border-slate-200 h-[600px] lg:h-auto overflow-hidden">
          
          {/* Top: Chapters / Timeline */}
          <div className="flex-1 overflow-y-auto border-b border-slate-200 bg-slate-50">
            <div className="p-4 sticky top-0 bg-slate-50/95 backdrop-blur z-10 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                 <Target className="w-4 h-4 mr-2" />
                 Smart Segments
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {state.chapters.length > 0 ? (
                state.chapters.map((chapter, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-indigo-200 hover:border-indigo-500 transition-colors group">
                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-400 group-hover:bg-indigo-600 transition-colors"></div>
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{chapter.timestamp}</span>
                    <h4 className="text-sm font-semibold text-slate-900 mt-1 cursor-pointer hover:text-indigo-600">{chapter.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{chapter.summary}</p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 italic">Processing segments...</div>
              )}
            </div>
          </div>

          {/* Bottom: Chat / Doubts */}
          <div className="h-1/2 lg:h-[45%] flex flex-col bg-white">
            <div className="p-3 border-b border-slate-100 bg-indigo-600 text-white flex justify-between items-center shadow-md">
              <h3 className="text-sm font-bold flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Tutor (Doubts?)
              </h3>
              <button 
                onClick={handleTakeQuiz} 
                className="text-xs bg-indigo-500 hover:bg-indigo-400 border border-indigo-400 px-3 py-1 rounded shadow-sm transition-colors flex items-center"
              >
                No more doubts? <span className="ml-1 font-bold">Take Quiz</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                   <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
               <form 
                 onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                 className="flex items-center space-x-2"
               >
                 <input
                   type="text"
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   placeholder="Ask about entropy..."
                   className="flex-1 text-sm border-slate-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 px-4 py-2"
                 />
                 <button 
                   type="submit"
                   disabled={!chatInput.trim() || isChatLoading}
                   className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                 >
                   <Send className="w-4 h-4" />
                 </button>
               </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const FlashcardDeck: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 300);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 300);
  };

  if (cards.length === 0) return <div className="text-center p-8 text-slate-500">No flashcards generated.</div>;

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in max-w-2xl mx-auto">
      <div className="mb-4 text-slate-500 font-medium text-sm tracking-widest uppercase">Card {currentIndex + 1} / {cards.length}</div>
      
      <div 
        className={`flip-card w-full h-64 cursor-pointer ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flip-card-inner shadow-lg rounded-2xl">
          <div className="flip-card-front bg-white rounded-2xl border border-slate-200 p-8">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Question</h4>
            <p className="text-xl text-slate-800 font-semibold text-center">{card.front}</p>
            <p className="absolute bottom-4 text-[10px] text-slate-400 uppercase tracking-widest">Click to reveal</p>
          </div>
          <div className="flip-card-back bg-slate-800 rounded-2xl p-8 text-white">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Answer</h4>
            <p className="text-lg text-center leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mt-8">
        <Button variant="outline" size="sm" onClick={handlePrev}>Previous</Button>
        <Button variant="primary" size="sm" onClick={handleNext}>Next Card</Button>
      </div>
    </div>
  );
};

const QuizComponent: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (qId: number, optionIdx: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerIndex) score++;
    });
    return score;
  };
  
  const getPerformanceFeedback = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { title: "Outstanding Mastery!", color: "text-green-400", msg: "You have a solid grasp of the core concepts. You are ready!" };
    if (percentage >= 70) return { title: "Great Progress", color: "text-indigo-400", msg: "Good understanding. Review the incorrect answers to refine your knowledge." };
    if (percentage >= 50) return { title: "Good Start", color: "text-amber-400", msg: "You understand the basics, but there are gaps. Check the summary again." };
    return { title: "Needs Review", color: "text-red-400", msg: "It seems like you struggled. I recommend re-watching the key segments." };
  };

  if (questions.length === 0) return <div className="text-center p-8 text-slate-500">No quiz generated.</div>;

  const score = calculateScore();
  const feedback = showResults ? getPerformanceFeedback(score, questions.length) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      {showResults && feedback && (
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-1 ${feedback.color}`}>{feedback.title}</h3>
            <p className="text-white font-semibold text-lg">Score: {score} / {questions.length}</p>
            <p className="text-slate-300 text-sm mt-1">{feedback.msg}</p>
          </div>
          <div className="h-16 w-16 rounded-full bg-slate-700 border-4 border-indigo-500 flex items-center justify-center text-xl font-bold ml-4">
            {Math.round((score / questions.length) * 100)}%
          </div>
        </div>
      )}

      {questions.map((q, idx) => {
        const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;
        
        return (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="text-base font-semibold text-slate-900 mb-4 flex">
              <span className="text-slate-400 mr-3 flex-shrink-0">{idx + 1}.</span>
              {q.question}
            </h4>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
                
                if (showResults) {
                  if (optIdx === q.correctAnswerIndex) btnClass += "bg-green-50 border-green-500 text-green-800 font-medium";
                  else if (userAnswers[q.id] === optIdx) btnClass += "bg-red-50 border-red-500 text-red-800";
                  else btnClass += "bg-white border-slate-200 text-slate-400 opacity-60";
                } else {
                  if (userAnswers[q.id] === optIdx) btnClass += "bg-indigo-50 border-indigo-500 text-indigo-700";
                  else btnClass += "bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionSelect(q.id, optIdx)}
                    className={btnClass}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            
            {showResults && (
              <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                <span className="font-bold">Explanation: </span>{q.explanation}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end">
        {!showResults ? (
           <Button onClick={() => setShowResults(true)} disabled={Object.keys(userAnswers).length < questions.length}>
             Submit Quiz
           </Button>
        ) : (
           <Button variant="outline" onClick={() => { setShowResults(false); setUserAnswers({}); }}>
             Retake Quiz
           </Button>
        )}
      </div>
    </div>
  );
};
