import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Save, Info } from "lucide-react";
import { useChecklistTemplates, useUpsertChecklistTemplate } from "@/hooks/useEmails";

type Task = { name: string; delay: string };

const DELAY_OPTIONS = [
  { value: "immediate", label: "Immédiatement" },
  { value: "1h", label: "Dans 1h" },
  { value: "J-1", label: "J-1" },
  { value: "J-3", label: "J-3" },
  { value: "J-5", label: "J-5" },
  { value: "J-7", label: "J-7" },
  { value: "J-14", label: "J-14" },
  { value: "J-30", label: "J-30" },
];

const DEFAULT_TASKS: Task[] = [
  { name: "Envoyer le devis", delay: "immediate" },
  { name: "Relancer si pas de réponse", delay: "J-3" },
  { name: "Commander les ingrédients", delay: "J-5" },
  { name: "Confirmer l'équipe", delay: "J-3" },
  { name: "Préparer le matériel", delay: "J-1" },
];

const ChecklistTemplates = () => {
  const { data: templates, isLoading } = useChecklistTemplates();
  const upsertTemplate = useUpsertChecklistTemplate();
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing template
  useEffect(() => {
    if (templates?.length) {
      const defaultTemplate = templates.find((t: any) => !t.event_type);
      if (defaultTemplate?.tasks && Array.isArray(defaultTemplate.tasks)) {
        setTasks(defaultTemplate.tasks as Task[]);
      }
    }
  }, [templates]);

  const updateTask = (index: number, field: keyof Task, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
    setHasChanges(true);
  };

  const addTask = () => {
    setTasks([...tasks, { name: "", delay: "J-3" }]);
    setHasChanges(true);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const moveTask = (from: number, to: number) => {
    if (to < 0 || to >= tasks.length) return;
    const updated = [...tasks];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setTasks(updated);
    setHasChanges(true);
  };

  const save = () => {
    upsertTemplate.mutate({ event_type: null, tasks });
    setHasChanges(false);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📋 Templates de checklist</h1>
        <p className="text-muted-foreground text-sm">Personnalisez les tâches automatiquement ajoutées à chaque nouvel événement créé depuis un email.</p>
      </div>

      {/* Info banner */}
      <Card className="rounded-2xl bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            💡 Ces tâches seront automatiquement ajoutées à chaque nouveau événement créé depuis un email. 
            Vous pourrez les modifier individuellement dans chaque événement.
          </p>
        </CardContent>
      </Card>

      {/* Template editor */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Checklist par défaut pour les nouveaux événements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveTask(index, index - 1)}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5"
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              <Input
                value={task.name}
                onChange={(e) => updateTask(index, "name", e.target.value)}
                placeholder="Nom de la tâche..."
                className="flex-1"
              />
              <Select value={task.delay} onValueChange={(v) => updateTask(index, "delay", v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="text-destructive/50 hover:text-destructive h-8 w-8" onClick={() => removeTask(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" className="w-full gap-2 mt-2" onClick={addTask}>
            <Plus className="h-4 w-4" /> Ajouter une tâche
          </Button>

          {hasChanges && (
            <Button variant="accent" className="w-full gap-2 mt-4" onClick={save} disabled={upsertTemplate.isPending}>
              <Save className="h-4 w-4" /> Enregistrer les modifications
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistTemplates;
