import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TemplateStructure, TemplateType } from "@/hooks/useCustomTemplates";
import { toast } from "sonner";

interface ImportTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templateType: TemplateType;
  onImported: (structure: TemplateStructure, filename: string) => void;
}

const ImportTemplateModal = ({ open, onClose, templateType, onImported }: ImportTemplateModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      // Read file content as text (for txt/json) or base64
      let content = "";
      if (file.type === "application/json" || file.type === "text/plain") {
        content = await file.text();
      } else {
        // For other types, read as text to extract what we can
        content = await file.text();
      }

      // Use AI to analyze structure
      const { data, error } = await supabase.functions.invoke("ai-template-fill", {
        body: {
          template: {
            titre: `Template importé — ${file.name}`,
            sections: [],
          },
          dataset: {
            instruction: "Analyse ce contenu de document et génère un template structuré avec des sections et des champs pertinents pour un traiteur événementiel. Crée des sections logiques avec des champs vides (origin='vide') que l'utilisateur pourra remplir.",
            file_content: content.substring(0, 5000), // limit for API
            file_name: file.name,
            template_type: templateType,
          },
        },
      });

      if (error) throw error;
      if (data?.template) {
        onImported(data.template, file.name);
        toast.success(`Template créé depuis "${file.name}"`);
        onClose();
      } else {
        throw new Error("L'IA n'a pas pu analyser le document");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'import");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Importer un modèle</DialogTitle>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            isDragging ? "border-purple-400 bg-purple-50/50" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-purple-600" />
              <p className="font-semibold">Analyse IA en cours...</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-semibold">Glissez votre fichier ici</p>
              <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, JSON, Image</p>
              <label className="inline-block">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.json,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                <Button variant="outline" size="sm" asChild className="cursor-pointer">
                  <span><FileText className="h-4 w-4 mr-2" /> Parcourir</span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTemplateModal;
