import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Save } from "lucide-react";
import { useRhSettings, useUpsertRhSettings, useWhatsappTemplates, useUpsertWhatsappTemplate } from "@/hooks/useHrModule";

const HrSettings = () => {
  const { data: settings, isLoading } = useRhSettings();
  const upsertSettings = useUpsertRhSettings();
  const { data: templates } = useWhatsappTemplates();
  const upsertTemplate = useUpsertWhatsappTemplate();

  const [form, setForm] = useState({
    guests_per_server: 25,
    guests_per_chef: 60,
    guests_per_bartender: 80,
    head_waiter_enabled: true,
    coeff_mariage: 1.2,
    coeff_corporate: 1.0,
    coeff_anniversaire: 1.1,
    auto_replace_after_hours: 12,
  });

  const [templateContent, setTemplateContent] = useState("");
  const [templateName, setTemplateName] = useState("Défaut");

  useEffect(() => {
    if (settings) {
      setForm({
        guests_per_server: settings.guests_per_server || 25,
        guests_per_chef: settings.guests_per_chef || 60,
        guests_per_bartender: settings.guests_per_bartender || 80,
        head_waiter_enabled: settings.head_waiter_enabled ?? true,
        coeff_mariage: settings.coeff_mariage || 1.2,
        coeff_corporate: settings.coeff_corporate || 1.0,
        coeff_anniversaire: settings.coeff_anniversaire || 1.1,
        auto_replace_after_hours: settings.auto_replace_after_hours || 12,
      });
    }
  }, [settings]);

  useEffect(() => {
    const defaultTemplate = templates?.find((t: any) => t.is_default);
    if (defaultTemplate) {
      setTemplateContent(defaultTemplate.content);
      setTemplateName(defaultTemplate.name);
    } else {
      setTemplateContent(`Bonjour {{prenom}} 👋\n\nNous organisons un {{type_evenement}} le {{date}} à {{lieu}}.\nHoraires : {{horaire}}\nPoste : {{poste}}\nConvives : {{nombre_convives}}\n\nEs-tu disponible ? Réponds OUI/NON 🙏`);
    }
  }, [templates]);

  const handleSave = () => {
    upsertSettings.mutate(form);

    // Save template
    const defaultTemplate = templates?.find((t: any) => t.is_default);
    upsertTemplate.mutate({
      id: defaultTemplate?.id,
      name: templateName,
      content: templateContent,
      is_default: true,
    });
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* Ratios RH */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Ratios RH
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">1 serveur pour X convives</Label>
              <Input
                type="number"
                value={form.guests_per_server}
                onChange={(e) => setForm({ ...form, guests_per_server: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">1 chef pour X convives</Label>
              <Input
                type="number"
                value={form.guests_per_chef}
                onChange={(e) => setForm({ ...form, guests_per_chef: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">1 barman pour X convives</Label>
              <Input
                type="number"
                value={form.guests_per_bartender}
                onChange={(e) => setForm({ ...form, guests_per_bartender: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium">Maître d'hôtel</p>
              <p className="text-xs text-muted-foreground">1 maître d'hôtel par événement</p>
            </div>
            <Switch
              checked={form.head_waiter_enabled}
              onCheckedChange={(v) => setForm({ ...form, head_waiter_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Coefficients */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Coefficients par type d'événement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Mariage</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.1"
                  value={form.coeff_mariage}
                  onChange={(e) => setForm({ ...form, coeff_mariage: Number(e.target.value) })}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  +{Math.round((form.coeff_mariage - 1) * 100)}%
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm">Corporate</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.1"
                  value={form.coeff_corporate}
                  onChange={(e) => setForm({ ...form, coeff_corporate: Number(e.target.value) })}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  +{Math.round((form.coeff_corporate - 1) * 100)}%
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm">Anniversaire</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.1"
                  value={form.coeff_anniversaire}
                  onChange={(e) => setForm({ ...form, coeff_anniversaire: Number(e.target.value) })}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  +{Math.round((form.coeff_anniversaire - 1) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-remplacement */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Auto-remplacement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label className="text-sm shrink-0">Déclencher après</Label>
            <Input
              type="number"
              value={form.auto_replace_after_hours}
              onChange={(e) => setForm({ ...form, auto_replace_after_hours: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">heures sans réponse</span>
          </div>
        </CardContent>
      </Card>

      {/* Template WhatsApp */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Template WhatsApp par défaut</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Variables : {"{{prenom}}"}, {"{{date}}"}, {"{{lieu}}"}, {"{{type_evenement}}"}, {"{{poste}}"}, {"{{horaire}}"}, {"{{nombre_convives}}"}
          </p>
          <Textarea
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            className="min-h-[160px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Button className="gap-2" onClick={handleSave} disabled={upsertSettings.isPending}>
        <Save className="h-4 w-4" />
        {upsertSettings.isPending ? "Sauvegarde..." : "Sauvegarder les paramètres RH"}
      </Button>
    </div>
  );
};

export default HrSettings;
