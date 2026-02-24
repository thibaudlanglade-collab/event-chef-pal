import { Sparkles, Check, Settings, Upload, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateStructure } from "@/hooks/useCustomTemplates";

interface TemplateToolbarProps {
  onAiFill: () => void;
  onValidateAll: () => void;
  onEditTemplate: () => void;
  onImport: () => void;
  onReset: () => void;
  isAiFilling: boolean;
  hasAutoFields: boolean;
}

const TemplateToolbar = ({
  onAiFill,
  onValidateAll,
  onEditTemplate,
  onImport,
  onReset,
  isAiFilling,
  hasAutoFields,
}: TemplateToolbarProps) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-card border rounded-xl no-print">
      <Button
        variant="outline"
        size="sm"
        onClick={onAiFill}
        disabled={isAiFilling}
        className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
      >
        {isAiFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isAiFilling ? "Analyse IA..." : "Remplir automatiquement"}
      </Button>

      {hasAutoFields && (
        <Button variant="outline" size="sm" onClick={onValidateAll} className="gap-2">
          <Check className="h-4 w-4" />
          Valider suggestions
        </Button>
      )}

      <Button variant="outline" size="sm" onClick={onEditTemplate} className="gap-2">
        <Settings className="h-4 w-4" />
        Modifier modèle
      </Button>

      <Button variant="outline" size="sm" onClick={onImport} className="gap-2">
        <Upload className="h-4 w-4" />
        Importer modèle
      </Button>

      <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Réinitialiser
      </Button>
    </div>
  );
};

export default TemplateToolbar;
