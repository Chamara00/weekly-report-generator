'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, askAssistant } from '@/lib/client-api';
import { cn } from '@/lib/utils';

interface Turn {
  role: 'user' | 'model';
  text: string;
  toolsUsed?: string[];
}

const SUGGESTIONS = [
  'What is blocking the team this week?',
  'Who has not submitted this week?',
  'Is anyone overloaded?',
  'Where did the time go last month?',
];

/**
 * Floating chat widget, rendered only for managers (see the app layout).
 *
 * Conversation state lives here, in the client, and the whole history is sent
 * with each question — the backend is stateless, which keeps the API simple and
 * means no conversation is ever persisted to the database.
 */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, pending]);

  async function send(question: string) {
    const text = question.trim();
    if (!text || pending) return;

    setError('');
    setInput('');
    const history = turns.map((turn) => ({ role: turn.role, text: turn.text }));
    setTurns((current) => [...current, { role: 'user', text }]);
    setPending(true);

    try {
      const result = await askAssistant({ message: text, history });
      setTurns((current) => [
        ...current,
        { role: 'model', text: result.answer, toolsUsed: result.toolsUsed },
      ]);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not reach the assistant. Is the backend running?',
      );
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button
        className="fixed right-4 bottom-4 z-40 h-12 gap-2 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Bot className="h-5 w-5" />
        Ask about the team
      </Button>
    );
  }

  return (
    <div className="bg-background fixed right-0 bottom-0 z-40 flex h-[min(600px,90svh)] w-full flex-col border shadow-xl sm:right-4 sm:bottom-4 sm:w-[420px] sm:rounded-lg">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">Team assistant</p>
            <p className="text-muted-foreground text-xs">
              Answers from your team&apos;s reports
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {turns.length === 0 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Ask about submissions, blockers, workload or a specific person.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="hover:bg-muted rounded-md border px-3 py-2 text-left text-sm"
                  onClick={() => void send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((turn, index) => (
          <div
            key={index}
            className={cn('flex', turn.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                turn.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {turn.text}
              {turn.toolsUsed && turn.toolsUsed.length > 0 ? (
                <p className="text-muted-foreground mt-2 text-[11px]">
                  looked up: {[...new Set(turn.toolsUsed)].join(', ')}
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {pending ? (
          <div className="text-muted-foreground flex justify-start text-sm">
            <div className="bg-muted rounded-lg px-3 py-2">Checking the reports…</div>
          </div>
        ) : null}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          disabled={pending}
          placeholder="Ask a question…"
          aria-label="Ask the team assistant"
          onChange={(event) => setInput(event.target.value)}
        />
        <Button type="submit" size="icon" disabled={pending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
