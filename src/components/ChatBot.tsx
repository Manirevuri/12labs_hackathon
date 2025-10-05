'use client';

import { useChat } from '@ai-sdk/react';
import { useState, Fragment } from 'react';
import { Bot } from 'lucide-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';

interface ChatBotProps {
  videoId: string;
  className?: string;
}

export default function ChatBot({ videoId, className = '' }: ChatBotProps) {
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    body: {
      videoId,
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    
    if (!hasText) {
      return;
    }

    sendMessage(
      { 
        text: message.text || ''
      },
      {
        body: {
          videoId,
        },
      },
    );
    setInput('');
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 rounded-lg p-4 ${className}`}>
      {/* Chat Header */}
      <div className="mb-4 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Video Analysis Assistant</h3>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Ask questions about the video content, themes, and analysis
        </p>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Start a conversation about this video! Ask me anything about the content, themes, or analysis.
                </p>
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>• "What are the main themes in this video?"</p>
                  <p>• "Describe the emotional journey"</p>
                  <p>• "What products or brands are featured?"</p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                        </Fragment>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Prompt Input */}
        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Ask about the video analysis..."
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              {/* Empty for now, can add tools later */}
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && status !== 'streaming'} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}