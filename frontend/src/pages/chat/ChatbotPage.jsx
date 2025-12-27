import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Component để render markdown với code highlighting
const MarkdownMessage = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';
          
          return !inline ? (
            <SyntaxHighlighter
              style={dracula}
              language={language}
              PreTag="div"
              className="rounded-md my-2"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-gray-800 text-red-400 px-2 py-1 rounded text-sm" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2">{children}</p>,
        h1: ({ children }) => <h1 className="text-2xl font-bold my-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold my-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold my-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-400 pl-3 my-2 italic">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const ChatbotPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null); // Lưu ID tin nhắn đang typing
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const CHAT_API = 'http://localhost:8001'; // Chat service URL

  // Scroll to bottom khi có message mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // Load sessions khi component mount
  useEffect(() => {
    console.log('useEffect - user:', user);
    if (user?.id) {
      console.log('useEffect - calling loadSessions with user.id:', user.id);
      loadSessions();
    } else {
      console.log('useEffect - user.id not available yet');
    }
  }, [user?.id]);

  // Load messages khi session thay đổi
  useEffect(() => {
    if (currentSession?.id) {
      loadMessages(currentSession.id);
    } else {
      setMessages([]);
    }
  }, [currentSession?.id]);

  const loadSessions = async () => {
    try {
      
      if (!user?.id) {
        setSessionLoading(false);
        return;
      }

      setSessionLoading(true);
      
      const response = await axios.post(`${CHAT_API}/chat/sessions`, {
        user_id: user.id,
        limit: 50,
        offset: 0
      });
      
      console.log('Loaded sessions:', response.data);   
      setSessions(response.data);
      if (response.data.length > 0 && !currentSession) {
        setCurrentSession(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
    } finally {
      setSessionLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const response = await axios.post(`${CHAT_API}/chat/messages`, {
        user_id: user.id,
        session_id: sessionId,
        limit: 100,
        offset: 0
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewSession = async () => {
    // Tạo tên mặc định "New Chat"
    const sessionName = `New Chat`;

    try {
      // Gửi tin nhắn đầu tiên để tạo session
      const response = await axios.post(`${CHAT_API}/chat/send`, {
        user_id: user.id,
        session_id: null, // Server sẽ tạo session mới
        message: `[NEW_SESSION] ${sessionName}`,
        session_data: { name: sessionName }
      });

      // Reload sessions
      await loadSessions();
      
      // Set current session với session_id từ response
      if (response.data.session_id) {
        const newSession = sessions.find(s => s.id === response.data.session_id);
        if (newSession) {
          setCurrentSession(newSession);
        } else {
          // Fallback: reload sessions lại
          setTimeout(() => loadSessions(), 500);
        }
      }
      
      setShowNewSessionInput(false);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Lỗi khi tạo session');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentSession) return;

    const messageContent = inputMessage;
    setInputMessage('');
    
    // Hiển thị tin nhắn user ngay lập tức
    const newUserMessage = {
      id: Date.now(),
      message_type: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    // Tạo ID cho tin nhắn AI
    const aiMessageId = Date.now() + 1;
    const newAIMessage = {
      id: aiMessageId,
      message_type: 'assistant',
      content: '', // Bắt đầu với nội dung rỗng
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newAIMessage]);
    setTypingMessageId(aiMessageId);

    try {
      const response = await axios.post(`${CHAT_API}/chat/send`, {
        user_id: user.id,
        session_id: currentSession.id,
        message: messageContent,
        session_data: { name: currentSession.session_name }
      });

      // Hiệu ứng typing - hiển thị từng ký tự
      const fullResponse = response.data.response;
      let currentText = '';
      
      for (let i = 0; i < fullResponse.length; i++) {
        currentText += fullResponse[i];
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: currentText } : msg
          )
        );
        
        // Delay 20ms giữa mỗi ký tự (điều chỉnh tốc độ typing)
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Lỗi khi gửi tin nhắn');
      setInputMessage(messageContent);
      setMessages(prev => prev.filter(msg => msg.id !== newUserMessage.id && msg.id !== aiMessageId));
    } finally {
      setLoading(false);
      setTypingMessageId(null);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa session này?')) return;

    try {
      await axios.delete(`${CHAT_API}/chat/session/${sessionId}`, {
        params: { user_id: user.id }
      });

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(sessions.find(s => s.id !== sessionId) || null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Lỗi khi xóa session');
    }
  };

  // Guard clause - nếu auth đang load hoặc user không có
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">Vui lòng đăng nhập để sử dụng chatbot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:relative absolute z-1000 flex md:h-screen flex-col md:flex-row-reverse md:py-[2vh] md:px-3 gap-4 w-full bg-gray-100 md:mt-0 md:overflow-hidden overflow-auto">
      {/* Sidebar - Sessions */}
      <div className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessionLoading ? (
            <div className="text-gray-400 text-center py-8">Đang tải...</div>
          ) : sessions.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">
              Chưa có session nào
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={`p-3 rounded-lg cursor-pointer transition-colors group flex justify-between items-center ${
                  currentSession?.id === session.id
                    ? 'bg-gray-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{session.session_name || 'Chat'}</p>
                  <p className="text-xs text-gray-400">
                    {session.message_count} tin nhắn
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="ml-2 p-1 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa session"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          {showNewSessionInput ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-2">Tạo chat mới</p>
              <div className="flex gap-2">
                <button
                  onClick={createNewSession}
                  className="flex-1 px-3 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 font-medium"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => {
                    setShowNewSessionInput(false);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewSessionInput(true)}
              className="w-full px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + New Chat
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col border border-gray-300 rounded-lg bg-white shadow max-h-screen">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            {currentSession ? currentSession.session_name || 'Chat' : 'Chọn hoặc tạo chat'}
          </h1>
          <div className="md:hidden">
            <button
              onClick={() => setShowNewSessionInput(!showNewSessionInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {!currentSession ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Chọn hoặc tạo một cuộc trò chuyện mới</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p>Bắt đầu một cuộc trò chuyện</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-full px-4 py-2 rounded-lg ${
                    msg.message_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.message_type === 'assistant' ? (
                    <div className="text-sm">
                      <MarkdownMessage content={msg.content} />
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {currentSession && (
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotPage;
