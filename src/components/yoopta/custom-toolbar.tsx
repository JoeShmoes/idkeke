import { FC } from 'react';
import { useYooptaEditor, useYooptaTools } from '@yoopta/editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

const CustomToolbar: FC = () => {
  const editor = useYooptaEditor();
  const tools = useYooptaTools();

  const onToggleAI = () => {
    tools.ai.toggle();
  };

  return (
    <Button size="icon" variant="ghost" onClick={onToggleAI}>
      <Wand2 size={20} />
    </Button>
  );
};

export default CustomToolbar;
