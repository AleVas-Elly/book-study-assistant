import { useState, useEffect, type ChangeEvent, useRef } from 'react';
import { checkHealth, uploadPdf, sendChatMessage } from './api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');

  // App State: 'upload' | 'chat'
  const [appState, setAppState] = useState<'upload' | 'chat'>('upload');
  const [bookId, setBookId] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Upload State
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth()
      .then((data) => setHealthStatus(data.status))
      .catch(() => setHealthStatus('Offline'));

    // Load API key from local storage if available
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadStatus('Error: Please select a PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      const result = await uploadPdf(file);
      setUploadStatus(`Success: ${result.status}`);
      setBookId(result.id);

      // Transition to chat after short delay
      setTimeout(() => {
        setAppState('chat');
        setMessages([{ role: 'assistant', content: `I've read **${result.filename}**. Ask me anything about it!` }]);
      }, 1000);

    } catch (error) {
      setUploadStatus('Error: Upload failed. Is the backend running?');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !bookId) return;

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const result = await sendChatMessage(userMsg, bookId, apiKey);
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not get response. Check your API Key or Backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-2xl">📚</span>
            Book Study <span className="text-indigo-600">Assistant</span>
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${healthStatus === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-500 hidden sm:inline">{healthStatus === 'ok' ? 'Online' : 'Offline'}</span>
            </div>
            {appState === 'chat' && (
              <button
                onClick={() => { setAppState('upload'); setMessages([]); setBookId(null); }}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Upload New
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* API Key Input (Always visible if empty and in chat mode, or unobtrusive) */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="password"
              placeholder="Enter your Gemini API Key (optional if host configured)"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔑</span>
          </div>
          <p className="text-xs text-center text-gray-400 mt-1">
            Required only if the server doesn't have a default key. <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-indigo-500">Get one free</a>.
          </p>
        </div>

        {appState === 'upload' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center space-y-6 transform transition-all hover:scale-[1.01]">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Upload your Book</h2>
              <p className="text-gray-500">Select a PDF to start chatting with your AI study companion.</p>

              <div className="relative group">
                <div className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${isUploading ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-500 hover:bg-gray-50'}`}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-indigo-600">
                      {isUploading ? 'Processing...' : 'Click to browse'}
                    </p>
                    <p className="text-xs text-gray-400">PDF up to 10MB</p>
                  </div>
                </div>
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-lg text-sm font-medium animate-pulse ${uploadStatus.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[75vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-none px-5 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about the book..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
