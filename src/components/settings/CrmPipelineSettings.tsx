import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineStages, useUpsertPipelineStage, useDeletePipelineStage, useFollowupTemplates, useUpsertFollowupTemplate } from "@/hooks/usePipeline";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { GripVertical, Trash2, Plus, RotateCcw, Palette, Mail } from "lucide-react";

const DEFAULT_STAGES = [
  { name: "Prospect", color: "#9CA3AF", position: 0, alert_threshold_days: 7, is_default: true },
  { name: "Devis envoyé", color: "#F59E0B", position: 1, alert_threshold_days: 3, is_default: false },
  { name: "Négociation", color: "#3B82F6", position: 2, alert_threshold_days: 5, is_default: false },
  { name: "Confirmé", color: "#10B981", position: 3, alert_threshold_days: 14, is_default: false },
  { name: "Équipe créée", color: "#8B5CF6", position: 4, alert_threshold_days: 7, is_default: false },
  { name: "Perdu", color: "#EF4444", position: 5, alert_threshold_days: 999, is_default: false },
];

export function CrmPipelineSettings() {
  const { user } = useAuth();
  const { data: stages, isLoading } = usePipelineStages();
  const upsertStage = useUpsertPipelineStage();
  const deleteStage = useDeletePipelineStage();
  const { data: templates } = useFollowupTemplates();
  const upsertTemplate = useUpsertFollowupTemplate();

  const [localStages, setLocalStages] = useState<any[]>([]);
  const [localTemplates, setLocalTemplates] = useState<Record<string, { subject: string; body: string }>>({});

  useEffect(() => {
    if (stages) setLocalStages(stages.map((s: any) => ({ ...s })));
  }, [stages]);

  useEffect(() => {
    if (templates) {
      const map: Record<string, { subject: string; body: string }> = {};
      templates.forEach((t: any) => { map[t.stage_id] = { subject: t.subject_template, body: t.body_template }; });
      setLocalTemplates(map);
    }
  }, [templates]);

  const updateLocal = (index: number, field: string, value: any) => {
    setLocalStages((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    for (const stage of localStages) {
      await upsertStage.mutateAsync(stage);
    }
    // Save templates
    for (const [stageId, template] of Object.entries(localTemplates)) {
      const existing = templates?.find((t: any) => t.stage_id === stageId);
      await upsertTemplate.mutateAsync({
        id: existing?.id,
        stage_id: stageId,
        subject_template: template.subject,
        body_template: template.body,
      });
    }
    toast.success("Pipeline sauvegardé");
  };

  const handleAddStage = () => {
    setLocalStages((prev) => [...prev, {
      name: "Nouvelle étape",
      color: "#6B7280",
      position: prev.length,
      alert_threshold_days: 5,
      is_default: false,
      user_id: user?.id,
    }]);
  };

  const handleDelete = async (index: number) => {
    const stage = localStages[index];
    if (stage.id) await deleteStage.mutateAsync(stage.id);
    setLocalStages((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i })));
  };

  const handleReset = async () => {
    // Delete all existing then re-create defaults
    if (stages) {
      for (const s of stages) {
        await deleteStage.mutateAsync(s.id);
      }
    }
    for (const s of DEFAULT_STAGES) {
      await upsertStage.mutateAsync(s);
    }
    toast.success("Pipeline réinitialisé");
  };

  const handleSetDefault = (index: number) => {
    setLocalStages((prev) => prev.map((s, i) => ({ ...s, is_default: i === index })));
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* Stage customization */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Personnaliser votre pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {localStages.map((stage, index) => (
            <div key={stage.id || index} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                <span className="text-sm font-medium text-muted-foreground">Étape {index + 1}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nom</Label>
                  <Input value={stage.name} onChange={(e) => updateLocal(index, "name", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Couleur</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={stage.color} onChange={(e) => updateLocal(index, "color", e.target.value)} className="h-10 w-12 rounded cursor-pointer border-0" />
                    <Input value={stage.color} onChange={(e) => updateLocal(index, "color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Seuil d'alerte (jours)</Label>
                  <Input type="number" value={stage.alert_threshold_days} onChange={(e) => updateLocal(index, "alert_threshold_days", parseInt(e.target.value))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={stage.is_default} onCheckedChange={() => handleSetDefault(index)} />
                  <Label className="text-xs">Étape par défaut</Label>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(index)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddStage} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Ajouter une étape
          </Button>
        </CardContent>
      </Card>

      {/* Followup templates */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Templates de relance</CardTitle>
          <p className="text-xs text-muted-foreground">
            Variables : {"{{client_name}}"} {"{{event_type}}"} {"{{event_date}}"} {"{{guest_count}}"} {"{{company_name}}"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {localStages.filter((s) => s.name !== "Perdu").map((stage) => (
            <div key={stage.id || stage.name} className="border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                Template pour : {stage.name}
              </p>
              <div>
                <Label className="text-xs">Objet</Label>
                <Input
                  value={localTemplates[stage.id]?.subject || ""}
                  onChange={(e) => setLocalTemplates((prev) => ({ ...prev, [stage.id]: { ...prev[stage.id] || { body: "" }, subject: e.target.value } }))}
                  placeholder="Relance — {{event_type}} {{event_date}}"
                />
              </div>
              <div>
                <Label className="text-xs">Corps</Label>
                <Textarea
                  value={localTemplates[stage.id]?.body || ""}
                  onChange={(e) => setLocalTemplates((prev) => ({ ...prev, [stage.id]: { ...prev[stage.id] || { subject: "" }, body: e.target.value } }))}
                  rows={5}
                  placeholder="Bonjour {{client_name}},&#10;&#10;..."
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="accent" onClick={handleSave} disabled={upsertStage.isPending}>
          Enregistrer les modifications
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Réinitialiser
        </Button>
      </div>
    </div>
  );
}
