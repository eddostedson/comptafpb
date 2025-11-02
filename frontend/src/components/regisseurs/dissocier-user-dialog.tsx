'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface User {
  id: string;
  code?: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface DissocierUserDialogProps {
  user: User | null;
  regisseurNom: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DissocierUserDialog({
  user,
  regisseurNom,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DissocierUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Dissocier l'utilisateur
          </DialogTitle>
          <div className="text-sm text-muted-foreground pt-2 space-y-2">
            <div>
              Êtes-vous sûr de vouloir dissocier l'utilisateur{' '}
              <strong className="text-foreground">{user.prenom} {user.nom}</strong>
              {user.code && <span> ({user.code})</span>} du régisseur{' '}
              <strong className="text-foreground">{regisseurNom}</strong> ?
            </div>
            <div className="text-muted-foreground text-xs bg-muted/50 p-2 rounded border">
              ℹ️ <strong>Note :</strong> Cette action retirera uniquement l'association avec le régisseur. L'utilisateur ne sera pas supprimé et pourra être réassocié ultérieurement si nécessaire.
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
            variant="default"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dissociation...
              </>
            ) : (
              'Confirmer la dissociation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


