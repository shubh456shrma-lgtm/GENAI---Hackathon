import React, { useState, useEffect } from 'react';
import { UploadSection } from './components/UploadSection';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { AppState, ViewState, ExamType, TimeFrame, LectureData, User } from './types';
import { generateSummary, generateExamStrategy, generateQuiz, generateFlashcards, generateCheatSheet, generateChapters, extractFormulas } from './services/geminiService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    view: ViewState.AUTH,
    user: null,
    lecture: null,
    examType: ExamType.UNIVERSITY,
    timeFrame: TimeFrame.ONE_WEEK,
    summary: '',
    chapters: [],
    formulas: [],
    strategy: null,
    quiz: [],
    flashcards: [],
    cheatSheet: '',
    chatHistory: [],
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Session check failed (likely missing Supabase config):", error.message);
          return;
        }
        
        if (data?.session) {
          setAppState(prev => ({ 
            ...prev, 
            user: { 
              id: data.session.user.id, 
              email: data.session.user.email!, 
              name: data.session.user.user_metadata?.full_name 
            },
            view: ViewState.UPLOAD 
          }));
        }
      } catch (err) {
        console.warn("Supabase client error:", err);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAppState(prev => ({ 
          ...prev, 
          user: { 
            id: session.user.id, 
            email: session.user.email!, 
            name: session.user.user_metadata?.full_name 
          },
          view: prev.view === ViewState.AUTH ? ViewState.UPLOAD : prev.view
        }));
      } else {
        setAppState(prev => ({ ...prev, user: null, view: ViewState.AUTH }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setAppState(prev => ({ ...prev, user, view: ViewState.UPLOAD }));
  };

  const handleSignOut = () => {
    setAppState(prev => ({
      ...prev,
      view: ViewState.AUTH,
      user: null,
      lecture: null,
      summary: '',
      quiz: [],
      error: null
    }));
  };

  const handleStartProcessing = async (text: string, title: string, examType: ExamType, timeFrame: TimeFrame, videoId?: string) => {
    setAppState(prev => ({
      ...prev,
      view: ViewState.PROCESSING,
      lecture: { title, transcript: text, videoId },
      examType,
      timeFrame
    }));

    try {
      const [summary, chapters, formulas, strategy, quiz, flashcards, cheatSheet] = await Promise.all([
        generateSummary(text),
        generateChapters(text),
        extractFormulas(text),
        generateExamStrategy(text, examType, timeFrame),
        generateQuiz(text),
        generateFlashcards(text),
        generateCheatSheet(text)
      ]);

      setAppState(prev => ({
        ...prev,
        view: ViewState.DASHBOARD,
        summary,
        chapters,
        formulas,
        strategy,
        quiz,
        flashcards,
        cheatSheet,
        chatHistory: [{
          id: 'welcome',
          sender: 'ai',
          text: 'Hi! I am your AI Tutor. I have analyzed the lecture. Ask me anything about the concepts or specific doubts!',
          timestamp: new Date()
        }]
      }));
    } catch (error) {
      console.error(error);
      setAppState(prev => ({
        ...prev,
        view: ViewState.UPLOAD,
        error: "An error occurred while communicating with the AI. Please try again."
      }));
    }
  };

  const handleReset = () => {
    setAppState(prev => ({
      ...prev,
      view: ViewState.UPLOAD,
      lecture: null,
      summary: '',
      quiz: [],
      error: null
    }));
  };

  if (appState.view === ViewState.AUTH) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Error Toast */}
      {appState.error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative z-50 shadow-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{appState.error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setAppState(prev => ({ ...prev, error: null }))}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      {appState.view === ViewState.UPLOAD && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-indigo-50/30">
          <div className="w-full max-w-7xl mx-auto flex justify-end mb-4 px-4 sm:px-6 lg:px-8 absolute top-4 right-0">
             <div className="flex items-center space-x-2">
                 <span className="text-sm text-slate-600 hidden sm:inline">Logged in as {appState.user?.name || appState.user?.email}</span>
                 <button onClick={async () => { await supabase.auth.signOut(); handleSignOut(); }} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Sign Out</button>
             </div>
          </div>
          <UploadSection onStart={handleStartProcessing} />
        </div>
      )}

      {appState.view === ViewState.PROCESSING && (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full opacity-25 animate-ping"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Lecture...</h2>
          <p className="text-slate-500 animate-pulse">Extracting formulas, segmenting chapters, and building AI tutor...</p>
        </div>
      )}

      {appState.view === ViewState.DASHBOARD && (
        <Dashboard state={appState} onReset={handleReset} onSignOut={handleSignOut} />
      )}
    </div>
  );
};

export default App;
