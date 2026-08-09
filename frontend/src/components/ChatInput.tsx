import { ArrowUp, LoaderCircle, MessageCircleMore } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="border-t border-[#DADADA] bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className={`mx-auto flex max-w-3xl items-center gap-3 rounded-full border bg-[#F2F2F2] px-3 py-2 shadow-sm transition-all ${focused ? 'border-[#418FDE] ring-2 ring-[#418FDE]/20' : 'border-[#DADADA]'}`}>
        <MessageCircleMore className="ml-1 h-5 w-5 text-[#418FDE]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !disabled && value.trim()) {
              onSubmit();
            }
          }}
          placeholder="Ask about admissions, deadlines, or scholarship guidance..."
          className="flex-1 bg-transparent px-2 py-2 text-sm text-[#002147] outline-none placeholder:text-[#727272]"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#418FDE] text-white transition-all hover:bg-[#2f76b9] disabled:cursor-not-allowed disabled:bg-[#DADADA]"
        >
          {disabled ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
