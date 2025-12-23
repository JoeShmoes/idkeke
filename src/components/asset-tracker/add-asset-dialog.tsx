
'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Asset, AssetCategory } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (asset: Omit<Asset, 'id'>) => void;
  assetToEdit?: Asset;
}

export default function AddAssetDialog({ isOpen, onOpenChange, onSave, assetToEdit }: AddAssetDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('physical');
  const [value, setValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (assetToEdit) {
            setName(assetToEdit.name);
            setCategory(assetToEdit.category);
            setValue(String(assetToEdit.value));
            setPurchaseDate(new Date(assetToEdit.purchaseDate));
            setNotes(assetToEdit.notes || '');
        } else {
            setName('');
            setCategory('physical');
            setValue('');
            setPurchaseDate(new Date());
            setNotes('');
        }
    }
  }, [assetToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value || !purchaseDate) return;
    onSave({ name, category, value: parseFloat(value), purchaseDate: purchaseDate.toISOString(), notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{assetToEdit ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
            <DialogDescription>
              Enter the details for your asset below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., MacBook Pro 16" 
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: AssetCategory) => setCategory(value)}>
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Purchase Value ($)</Label>
              <Input 
                id="value" 
                type="number"
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                placeholder="e.g., 2500" 
                required
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !purchaseDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={purchaseDate}
                            onSelect={setPurchaseDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any relevant notes about this asset (e.g., serial number, warranty info)."
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{assetToEdit ? 'Save Changes' : 'Create Asset'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
