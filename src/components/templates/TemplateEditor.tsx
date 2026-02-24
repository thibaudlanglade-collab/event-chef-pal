import { useState } from "react";
import { Plus, Trash2, GripVertical, Save, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateStructure, TemplateSection, TemplateField, TemplateType } from "@/hooks/useCustomTemplates";

interface TemplateEditorProps {
  template: TemplateStructure;
  templateType: TemplateType;
  onSave: (structure: TemplateStructure) => void;
  onBack: () => void;
  onTestFill?: () => void;
}

const TemplateEditor = ({ template, templateType, onSave, onBack, onTestFill }: TemplateEditorProps) => {
  const [structure, setStructure] = useState<TemplateStructure>(JSON.parse(JSON.stringify(template)));

  const addSection = () => {
    setStructure({
      ...structure,
      sections: [...structure.sections, { titre: "Nouvelle section", champs: [] }],
    });
  };

  const removeSection = (idx: number) => {
    setStructure({
      ...structure,
      sections: structure.sections.filter((_, i) => i !== idx),
    });
  };

  const updateSectionTitle = (idx: number, titre: string) => {
    const sections = [...structure.sections];
    sections[idx] = { ...sections[idx], titre };
    setStructure({ ...structure, sections });
  };

  const addField = (sectionIdx: number) => {
    const sections = [...structure.sections];
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      label: "Nouveau champ",
      type: "text",
      value: "",
      origin: "vide",
    };
    sections[sectionIdx] = {
      ...sections[sectionIdx],
      champs: [...sections[sectionIdx].champs, newField],
    };
    setStructure({ ...structure, sections });
  };

  const removeField = (sectionIdx: number, fieldIdx: number) => {
    const sections = [...structure.sections];
    sections[sectionIdx] = {
      ...sections[sectionIdx],
      champs: sections[sectionIdx].champs.filter((_, i) => i !== fieldIdx),
    };
    setStructure({ ...structure, sections });
  };

  const updateField = (sectionIdx: number, fieldIdx: number, updates: Partial<TemplateField>) => {
    const sections = [...structure.sections];
    const champs = [...sections[sectionIdx].champs];
    champs[fieldIdx] = { ...champs[fieldIdx], ...updates };
    sections[sectionIdx] = { ...sections[sectionIdx], champs };
    setStructure({ ...structure, sections });
  };

  const typeLabels: Record<string, string> = {
    client: "Vue Client",
    traiteur: "Vue Gérant",
    maitreHotel: "Brief Maître d'Hôtel",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <h2 className="text-xl font-bold">Éditeur de template — {typeLabels[templateType]}</h2>
        </div>
        <div className="flex gap-2">
          {onTestFill && (
            <Button variant="outline" size="sm" onClick={onTestFill} className="gap-2 border-purple-300 text-purple-700">
              <Sparkles className="h-4 w-4" /> Tester IA
            </Button>
          )}
          <Button size="sm" onClick={() => onSave(structure)} className="gap-2">
            <Save className="h-4 w-4" /> Sauvegarder
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold">Titre du template</label>
        <Input
          value={structure.titre}
          onChange={(e) => setStructure({ ...structure, titre: e.target.value })}
          className="mt-1"
        />
      </div>

      {structure.sections.map((section, sIdx) => (
        <Card key={sIdx} className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <Input
                value={section.titre}
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                className="font-bold flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeSection(sIdx)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.champs.map((field, fIdx) => (
              <div key={field.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                <Input
                  value={field.label}
                  onChange={(e) => updateField(sIdx, fIdx, { label: e.target.value })}
                  className="flex-1 h-8 text-sm"
                  placeholder="Label du champ"
                />
                <Select
                  value={field.type}
                  onValueChange={(v) => updateField(sIdx, fIdx, { type: v as TemplateField["type"] })}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texte</SelectItem>
                    <SelectItem value="textarea">Multi-ligne</SelectItem>
                    <SelectItem value="number">Nombre</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeField(sIdx, fIdx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => addField(sIdx)} className="gap-2 text-muted-foreground">
              <Plus className="h-3.5 w-3.5" /> Ajouter un champ
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addSection} className="gap-2 w-full border-dashed">
        <Plus className="h-4 w-4" /> Ajouter une section
      </Button>
    </div>
  );
};

export default TemplateEditor;
