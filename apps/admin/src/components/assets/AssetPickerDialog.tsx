"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Check, Image } from "lucide-react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@buildbase/ui/components/ui/dialog";
import { API } from "@/services";
import type { IAsset } from "@buildbase/components/media-library";

interface AssetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: IAsset) => void;
  title?: string;
}

export function AssetPickerDialog({ open, onOpenChange, onSelect, title = "Select Image" }: AssetPickerDialogProps) {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchAssets = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const result = await API.mediaLibrary.getAssets({
        $page: 1,
        $limit: 60,
        search: q || undefined,
        contentType: "image",
      });
      setAssets(result.docs || []);
    } catch {
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      fetchAssets(search);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchAssets(search), 300);
    return () => clearTimeout(t);
  }, [search, open, fetchAssets]);

  const handleConfirm = () => {
    const asset = assets.find(a => a.id === selectedId);
    if (asset) {
      onSelect(asset);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search images..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="text-muted-foreground h-4 w-4" />
            </button>
          )}
        </div>

        <div className="h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <Image className="h-10 w-10 opacity-30" />
              <p className="text-sm">No images found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 p-1 sm:grid-cols-5 lg:grid-cols-6">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(prev => (prev === asset.id ? null : asset.id))}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedId === asset.id
                      ? "border-primary ring-primary/30 ring-2"
                      : "hover:border-muted-foreground/40 border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.filename || asset.name || "Asset"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {selectedId === asset.id && (
                    <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            <Check className="mr-2 h-4 w-4" />
            Select Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
