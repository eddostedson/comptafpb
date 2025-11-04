'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DivisionAdministrative {
  id: string;
  code?: string;
  region?: string;
  departement?: string;
  chefLieu?: string;
  sousPrefecture?: string;
  commune?: string;
  actif: boolean;
}

interface DeleteDivisionDialogProps {
  division: DivisionAdministrative | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteDivisionDialog({
  division,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteDivisionDialogProps) {
  if (!division) return null;

  const divisionName = division.region || division.commune || division.code || 'cette division';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <div className="text-sm text-muted-foreground pt-2 space-y-2">
            <div>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-foreground">{divisionName}</strong> ?
            </div>
            <div className="text-muted-foreground text-xs bg-muted/50 p-2 rounded border">
              ⚠️ <strong>Attention :</strong> Cette action est irréversible. La division administrative sera définitivement supprimée de la base de données.
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






