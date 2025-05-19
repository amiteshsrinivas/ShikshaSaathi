import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmileIcon } from 'lucide-react';

const emojis = [
  '😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💡',
  '🤔', '👏', '🙌', '💪', '🎯', '📚', '✍️', '🎓',
  '🧠', '💭', '🔍', '📝', '✅', '❌', '❓', '💯'
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-gray-100"
        >
          <SmileIcon className="h-5 w-5 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker; 