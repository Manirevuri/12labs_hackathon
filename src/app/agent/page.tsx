'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Actions,
  ActionsTrigger,
  ActionsContent,
} from '@/components/ai-elements/actions';
import { useState, Fragment, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useSearchParams } from 'next/navigation';
import { IndexSelector } from '@/components/IndexSelector';
import { Response } from '@/components/ai-elements/response';
import { GlobeIcon, RefreshCcwIcon, CopyIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { Action } from '@/components/ai-elements/actions';

const models = [
  {
    name: 'GPT 4o Mini',
    value: 'gpt-4o-mini',
  },
  {
    name: 'GPT 4o',
    value: 'gpt-4o',
  },
];

export default function AgentPage() {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlIndexId = searchParams.get('indexId');
  
  // Set initial index from URL if provided
  useEffect(() => {
    if (urlIndexId && !selectedIndex) {
      setSelectedIndex(urlIndexId);
    }
  }, [urlIndexId, selectedIndex]);
  
  const { messages, sendMessage, status, regenerate } = useChat({
    api: '/api/chat', // Use the same API as ChatBot for consistency
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      { 
        text: message.text || 'Sent with attachments',
        files: message.files 
      },
      {
        body: {
          indexId: selectedIndex,
        },
      },
    );
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white mb-4">Video Analysis Agent</h1>
          
          {/* Index Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Index for Context
            </label>
            <IndexSelector
              selectedIndex={selectedIndex}
              onIndexSelect={setSelectedIndex}
              placeholder="Choose an index for video analysis context..."
              className="w-full max-w-md"
            />
          </div>
          
          <p className="text-gray-400 text-sm">
            {selectedIndex 
              ? "Ask questions about videos in the selected index" 
              : "Select an index to get context-aware responses about your video library"
            }
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Conversation className="flex-1 overflow-hidden">
          <ConversationContent>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {selectedIndex ? "Ready to Analyze Your Videos!" : "Select an Index to Get Started"}
                </h3>
                <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                  {selectedIndex 
                    ? "I have access to your video analysis data. Ask me anything about your video content!" 
                    : "Choose an index above to unlock context-aware conversations about your video library."
                  }
                </p>
                {selectedIndex && (
                  <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto text-left">
                    <p className="text-gray-300 font-medium mb-3">Try asking:</p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>• "What videos do I have in this index?"</p>
                      <p>• "Summarize the main themes across my videos"</p>
                      <p>• "What insights can you extract from my content?"</p>
                      <p>• "Find videos about [specific topic]"</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
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
                          {message.role === 'assistant' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
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
        </div>

        <div className="mt-4 flex-shrink-0">
          <PromptInput onSubmit={handleSubmit} className="w-full" globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Ask me anything about video analysis..."
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && status !== 'streaming'} status={status} />
          </PromptInputToolbar>
        </PromptInput>
        </div>
      </div>
    </div>
  );
}