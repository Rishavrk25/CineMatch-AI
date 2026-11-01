import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useRecommendations from '../hooks/useRecommendations';
import ChatInterface from '../components/ChatInterface';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q');
  const hasTriggeredInitial = useRef(false);

  const {
    messages,
    loading,
    error,
    sendMessage,
    resetChat
  } = useRecommendations();

  useEffect(() => {
    if (initialQuery && !hasTriggeredInitial.current && messages.length === 0) {
      hasTriggeredInitial.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage, messages.length]);

  return (
    <div className="py-2">
      <ChatInterface
        messages={messages}
        loading={loading}
        onSendMessage={sendMessage}
        onReset={resetChat}
      />
    </div>
  );
}
