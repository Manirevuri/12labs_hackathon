'use client';

import { useChat } from '@ai-sdk/react';
import { useState, Fragment } from 'react';
import { Bot, Database } from 'lucide-react';
import { IndexSelector } from '@/components/IndexSelector';
import {
  Conversation,
  ConversationContent,
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
  videoId?: string;
  className?: string;
}

export default function ChatBot({ videoId, className = '' }: ChatBotProps) {
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    body: {
      videoId,
      indexId: selectedIndex,
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
          indexId: selectedIndex,
        },
      },
    );
    setInput('');
  };

  return (
    <div className={`flex flex-col bg-gray-950 rounded-lg border border-gray-800 ${className}`} style={{ height: '100%' }}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Video Analysis Assistant</h3>
        </div>
        
        {/* Index Selector */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Index
          </label>
          <IndexSelector
            selectedIndex={selectedIndex}
            onIndexSelect={setSelectedIndex}
            placeholder="Choose an index for context..."
            className="w-full"
          />
        </div>
        
        <p className="text-sm text-gray-400">
          {selectedIndex 
            ? "Ask questions about videos in the selected index" 
            : "Select an index to get context-aware responses about your videos"
          }
        </p>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-h-0">
        <Conversation className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
          <ConversationContent className="p-4 h-full overflow-y-auto scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-300 text-sm mb-4">
                  {selectedIndex 
                    ? "Start asking questions about your videos!" 
                    : "Select an index above to begin analyzing your videos"
                  }
                </p>
                {selectedIndex && (
                  <div className="mt-4 space-y-2 text-xs text-gray-400 bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300 font-medium mb-2">Try asking:</p>
                    <p>• "What videos do I have in this index?"</p>
                    <p>• "Summarize the content themes across my videos"</p>
                    <p>• "What are the key insights from my video library?"</p>
                  </div>
                )}
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
                              <Response className="whitespace-pre-wrap break-words max-w-none prose prose-invert prose-sm">
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
        </Conversation>
      </div>

      {/* Fixed Prompt Input at Bottom */}
      <div className="mt-4 flex-shrink-0">
        <PromptInput onSubmit={handleSubmit} className="w-full">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Ask about the video analysis..."
              className="resize-none"
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