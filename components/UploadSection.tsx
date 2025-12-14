import React, { useState } from 'react';
import { Upload, FileText, Youtube, Play, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { ExamType, TimeFrame } from '../types';
import { generateYouTubeTranscript } from '../services/geminiService';

interface UploadSectionProps {
  onStart: (text: string, title: string, examType: ExamType, timeFrame: TimeFrame, videoId?: string) => void;
}

const DEMO_LECTURE = `
[00:00] Welcome to this lecture on Introduction to Machine Learning. Today we are going to dive into the core paradigms: Supervised and Unsupervised learning.
[02:30] First, let's talk about Supervised Learning. Imagine a teacher and a student. The teacher provides problems and correct answers.
[05:45] Common algorithms include Linear Regression for regression problems and Logistic Regression for classification.
[10:15] Now, let's contrast this with Unsupervised Learning. Here, there is no teacher. The algorithm finds patterns in unlabeled data.
[15:20] The most common task here is Clustering, like K-Means clustering.
[20:00] To summarize: Supervised is like learning with an answer key. Unsupervised is like learning a language by listening.
`;

export const UploadSection: React.FC<UploadSectionProps> = ({ onStart }) => {
  const [text, setText] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [examType, setExamType] = useState<ExamType>(ExamType.UNIVERSITY);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(TimeFrame.ONE_WEEK);
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'youtube'>('text');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleDemo = () => {
    setText(DEMO_LECTURE.trim());
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchVideoTitle = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=${url}`);
      const data = await response.json();
      return data.title || null;
    } catch (error) {
      console.warn("Could not fetch video metadata", error);
      return null;
    }
  };

  const handleYouTubeProcess = async () => {
    if (!ytUrl) return;
    const videoId = extractVideoId(ytUrl);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }

    setIsTranscribing(true);
    setStatusMsg("Fetching video metadata...");
    
    try {
      // 1. Get the real title to help the AI find the right content
      const realTitle = await fetchVideoTitle(ytUrl);
      const displayTitle = realTitle || "YouTube Lecture";
      
      setStatusMsg("Analyzing video content (this may take a moment)...");
      
      // 2. Generate transcript with grounding
      const transcript = await generateYouTubeTranscript(ytUrl, realTitle || undefined);
      
      onStart(transcript, displayTitle, examType, timeFrame, videoId);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze video. Please check the link and try again.");
    } finally {
      setIsTranscribing(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Revise<span className="text-indigo-600">Right</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          The <span className="font-semibold text-indigo-600">Lecture Pilot</span>. Turn passive videos into active knowledge engines.
          Auto-notes, doubt solving, and exam prep in seconds.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'text' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Paste Text
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'youtube' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Youtube className="w-4 h-4 inline-block mr-2" />
            YouTube Link
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'file' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Upload File
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your lecture transcript, notes, or article here..."
                  className="w-full h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-700 placeholder:text-slate-400"
                />
                <button 
                  onClick={handleDemo}
                  className="absolute bottom-4 right-4 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition"
                >
                  Load Demo Content
                </button>
              </div>
            </div>
          )}

          {activeTab === 'youtube' && (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 px-8">
              <div className="w-full max-w-md space-y-2">
                <label className="text-sm font-medium text-slate-700">Video URL</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                    <Youtube className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold">Features:</span> Auto-segmentation, Doubt Solver Chatbot, Formula Extraction.
                </p>
                {isTranscribing && (
                   <p className="text-xs text-indigo-600 font-medium animate-pulse text-center pt-2">
                     {statusMsg || 'Processing...'}
                   </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="h-64 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 space-y-4">
              <div className="p-4 bg-white rounded-full shadow-sm">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">MP3, MP4, PDF, or TXT (Max 10MB)</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Exam Type</label>
              <select 
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Object.values(ExamType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Time Until Exam</label>
              <select 
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Object.values(TimeFrame).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <Button 
            onClick={() => activeTab === 'youtube' ? handleYouTubeProcess() : onStart(text, "Lecture 101", examType, timeFrame)}
            size="lg" 
            className="w-full"
            disabled={activeTab === 'youtube' ? (!ytUrl || isTranscribing) : text.length < 50}
            isLoading={isTranscribing}
          >
            {activeTab === 'youtube' ? (isTranscribing ? 'Processing Video...' : 'Launch Lecture Pilot') : 'Generate Revision Kit'}
            {!isTranscribing && <Play className="ml-2 w-4 h-4 fill-current" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
