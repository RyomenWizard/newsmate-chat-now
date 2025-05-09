
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { chatApi } from '@/services/api';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('default-session');
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await chatApi.fetchHistory(sessionId);
        if (history && Array.isArray(history)) {
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to load chat history', error);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await chatApi.sendMessage(inputMessage, sessionId);
      
      // Add bot response to chat
      if (response && response.text) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: response.text,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = async () => {
    try {
      setIsLoading(true);
      await chatApi.resetSession(sessionId);
      setMessages([]);
      toast.success('Chat session reset successfully');
    } catch (error) {
      console.error('Failed to reset session', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-newsmate-gray">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-newsmate-blue">NewsMate</h1>
        </div>
        <button
          onClick={handleResetSession}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-newsmate-light-blue text-newsmate-blue rounded-md hover:bg-opacity-80 transition-colors"
        >
          Reset Session
        </button>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isUser={message.sender === 'user'} 
            />
          ))
        )}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <form 
        onSubmit={handleSendMessage}
        className="flex items-center p-4 bg-white border-t border-gray-200"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-1 focus:ring-newsmate-blue"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className={`
            bg-newsmate-blue text-white px-4 py-2 rounded-r-lg
            ${(!inputMessage.trim() || isLoading) 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-opacity-90'}
          `}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
