import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Edit3, Upload, RefreshCw, User, ShieldCheck, ClipboardList } from "lucide-react";
import { useAllCustomTemplates, useSaveTemplate, useDeleteTemplate, useAiFillTemplate, getDefaultTemplate, TemplateType, TemplateStructure } from "@/hooks/useCustomTemplates";
import TemplateEditor from "@/components/templates/TemplateEditor";
import ImportTemplateModal from "@/components/templates/ImportTemplateModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TEMPLATE_TYPES: { type: TemplateType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: "client", label: "Vue Client", icon: <User className="h-5 w-5" />, description: "Dossier de présentation élégant pour le client" },
  { type: "traiteur", label: "Vue Gérant", icon: <ShieldCheck className="h-5 w-5" />, description: "Fiche de pilotage avec finances et logistique" },
  { type: "maitreHotel", label: "Brief Maître d'Hôtel", icon: <ClipboardList className="h-5 w-5" />, description: "Document terrain pour le jour J" },
];

const TemplateSettings = () => {
  const { data: templates } = useAllCustomTemplates();
  const saveTemplate = useSaveTemplate();
  const deleteTemplate = useDeleteTemplate();
  const aiFill = useAiFillTemplate();
  const [editingType, setEditingType] = useState<TemplateType | null>(null);
  const [importType, setImportType] = useState<TemplateType | null>(null);

  const getTemplateForType = (type: TemplateType) => {
    const saved = templates?.find((t: any) => t.template_type === type);
    return saved ? (saved.structure as unknown as TemplateStructure) : getDefaultTemplate(type);
  };

  const getTemplateInfo = (type: TemplateType) => {
    return templates?.find((t: any) => t.template_type === type);
  };

  if (editingType) {
    const structure = getTemplateForType(editingType);
    return (
      <TemplateEditor
        template={structure}
        templateType={editingType}
        onSave={(s) => {
          saveTemplate.mutate({ type: editingType, structure: s });
          setEditingType(null);
        }}
        onBack={() => setEditingType(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Templates personnalisés
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez la structure de vos documents. Importez un fichier ou modifiez directement l'éditeur visuel.
        </p>
      </div>

      <div className="grid gap-4">
        {TEMPLATE_TYPES.map(({ type, label, icon, description }) => {
          const info = getTemplateInfo(type);
          const structure = getTemplateForType(type);
          const fieldCount = structure.sections.reduce((acc, s) => acc + s.champs.length, 0);

          return (
            <Card key={type} className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {icon} {label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {info && (
                      <Badge variant="secondary" className="text-xs">
                        v{(info as any).version || 1}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {structure.sections.length} sections • {fieldCount} champs
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardHeader>
              <CardContent>
                {/* Mini preview */}
                <div className="bg-secondary/50 rounded-xl p-3 mb-4 text-xs">
                  {structure.sections.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <span className="font-semibold text-foreground">{s.titre}</span>
                      <span className="text-muted-foreground">— {s.champs.length} champs</span>
                    </div>
                  ))}
                  {structure.sections.length > 3 && (
                    <p className="text-muted-foreground mt-1">+ {structure.sections.length - 3} autres sections...</p>
                  )}
                </div>

                {info && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Dernière modification : {format(new Date((info as any).updated_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    {(info as any).source_filename && ` • Importé depuis "${(info as any).source_filename}"`}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditingType(type)}>
                    <Edit3 className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setImportType(type)}>
                    <Upload className="h-3.5 w-3.5" /> Importer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => deleteTemplate.mutate(type)}
                    disabled={!info}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {importType && (
        <ImportTemplateModal
          open
          onClose={() => setImportType(null)}
          templateType={importType}
          onImported={(structure, filename) => {
            saveTemplate.mutate({ type: importType, structure, sourceFilename: filename });
            setImportType(null);
          }}
        />
      )}
    </div>
  );
};

export default TemplateSettings;
