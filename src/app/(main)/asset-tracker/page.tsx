
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, DollarSign, Package, Laptop, Clapperboard, ExternalLink, Copy, Edit, Trash2 } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import type { Asset } from '@/lib/types';
import AddAssetDialog from '@/components/asset-tracker/add-asset-dialog';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useApp } from '@/components/layout/app-provider';
import { useHover } from '@/components/layout/hover-context';
import { format } from 'date-fns';

const categoryConfig: Record<Asset['category'], { label: string; icon: React.ElementType }> = {
    'physical': { label: 'Physical', icon: Package },
    'digital': { label: 'Digital', icon: Laptop },
    'creative': { label: 'Creative', icon: Clapperboard },
};


export default function AssetTrackerPage() {
  const { assets, setAssets, appSettings } = useApp();
  const { setHoveredItem } = useHover();
  const [isClient, setIsClient] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | undefined>(undefined);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const privacyClass = appSettings.finance.privacyMode ? 'blur-md select-none' : '';

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleToggleSelection = (assetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedAssets(prev => 
        prev.includes(assetId) 
          ? prev.filter(id => id !== assetId)
          : [...prev, assetId]
      );
  };
  
  const handleAddAsset = (newAsset: Omit<Asset, 'id'>) => {
    const assetToAdd: Asset = {
      ...newAsset,
      id: `asset-${Date.now()}`,
    };
    setAssets(prev => [assetToAdd, ...prev]);
  };
  
  const handleEditAsset = (updatedAsset: Omit<Asset, 'id'>) => {
    if(!assetToEdit) return;
    setAssets(prev => prev.map(p => p.id === assetToEdit.id ? {...assetToEdit, ...updatedAsset} : p))
  }

  const handleOpenEditDialog = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsAddAssetOpen(true);
  }
  
  const handleOpenAddDialog = () => {
    setAssetToEdit(undefined);
    setIsAddAssetOpen(true);
  }

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(p => p.id !== assetId));
  }

  const totalAssetValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.value, 0), [assets]);
  const physicalAssetValue = useMemo(
    () => assets.filter(a => a.category === 'physical').reduce((sum, a) => sum + a.value, 0),
    [assets]
  );
  const digitalAssetValue = useMemo(
    () => assets.filter(a => a.category === 'digital').reduce((sum, a) => sum + a.value, 0),
    [assets]
  );
  const creativeAssetValue = useMemo(
    () => assets.filter(a => a.category === 'creative').reduce((sum, a) => sum + a.value, 0),
    [assets]
  );
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const groupedAssets = useMemo(() => {
    return assets.reduce((acc, asset) => {
      (acc[asset.category] = acc[asset.category] || []).push(asset);
      return acc;
    }, {} as Record<Asset['category'], Asset[]>);
  }, [assets]);

  if (!isClient) {
      return (
        <div className="space-y-6">
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
        </div>
      )
  }

  return (
    <>
      <div className="space-y-8">
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold">Asset Tracker</h1>
                <p className="text-muted-foreground">An inventory of your physical, digital, and creative assets.</p>
            </div>
            <Button onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Asset
            </Button>
          </div>
          <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Total Assets" icon={Package} value={String(assets.length)} />
              <KpiCard title="Total Asset Value" icon={DollarSign} value={formatCurrency(totalAssetValue)} valueClassName={privacyClass} />
              <KpiCard title="Physical Value" icon={Package} value={formatCurrency(physicalAssetValue)} valueClassName={privacyClass} />
              <KpiCard title="Digital & Creative" icon={Laptop} value={formatCurrency(digitalAssetValue + creativeAssetValue)} valueClassName={privacyClass} />
          </div>

          {Object.entries(categoryConfig).map(([category, config]) => {
            const currentAssets = groupedAssets[category as Asset['category']] || [];
            if (currentAssets.length === 0) return null;
            
            return (
                <div key={category}>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <config.icon className="h-6 w-6" />
                        {config.label} Assets
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentAssets.map(asset => {
                            const CategoryIcon = categoryConfig[asset.category].icon;
                            const isSelected = selectedAssets.includes(asset.id);
                            return (
                                <ContextMenu key={asset.id}>
                                    <ContextMenuTrigger>
                                        <Card
                                            data-selectable="true"
                                            data-id={asset.id}
                                            className={cn(
                                                "overflow-hidden bg-card/50 hover:shadow-lg transition-shadow group flex flex-col cursor-pointer relative",
                                                isSelected && "ring-2 ring-primary bg-primary/10"
                                            )}
                                            onClick={(e) => handleToggleSelection(asset.id, e)}
                                            onMouseEnter={() =>
                                              setHoveredItem({
                                                type: 'asset',
                                                data: {
                                                  ...asset,
                                                  onEdit: () => handleOpenEditDialog(asset),
                                                  onDelete: () => handleDeleteAsset(asset.id),
                                                },
                                              })
                                            }
                                            onMouseLeave={() => setHoveredItem(null)}
                                        >
                                            <div className="flex-grow flex items-center justify-center bg-muted/30 p-8">
                                               <CategoryIcon className="h-20 w-20 text-muted-foreground" />
                                            </div>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <CardTitle>{asset.name}</CardTitle>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditDialog(asset);
                                                            }}>
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteAsset(asset.id);
                                                            }}>
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <CardDescription>
                                                    <span className={privacyClass}>{formatCurrency(asset.value)}</span> &bull; {format(new Date(asset.purchaseDate), 'MMM yyyy')}
                                                </CardDescription>
                                            </CardHeader>
                                            {asset.notes && (
                                                <CardContent className="pt-0">
                                                    <p className="text-sm text-muted-foreground border-t pt-2">{asset.notes}</p>
                                                </CardContent>
                                            )}
                                        </Card>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="w-56">
                                        <ContextMenuItem onClick={() => handleOpenEditDialog(asset)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </ContextMenuItem>
                                        <ContextMenuItem className="text-destructive" onClick={() => handleDeleteAsset(asset.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            )
                        })}
                    </div>
                </div>
            )
          })}
          
          {assets.length === 0 && (
            <div className="text-center py-20 rounded-lg border-2 border-dashed">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No assets tracked yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Click "Add Asset" to get started!</p>
            </div>
          )}
      </div>
      <AddAssetDialog 
        isOpen={isAddAssetOpen}
        onOpenChange={setIsAddAssetOpen}
        onSave={assetToEdit ? handleEditAsset : handleAddAsset}
        assetToEdit={assetToEdit}
      />
    </>
  );
}
