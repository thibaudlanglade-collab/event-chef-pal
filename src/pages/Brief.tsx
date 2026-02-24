import { useState, useEffect } from "react";
import { ClipboardList, Printer, AlertTriangle, Clock, Plus, Trash2, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TemplateToolbar from "@/components/templates/TemplateToolbar";
import TemplateSectionRenderer from "@/components/templates/TemplateSectionRenderer";
import TemplateEditor from "@/components/templates/TemplateEditor";
import ImportTemplateModal from "@/components/templates/ImportTemplateModal";
import { useCustomTemplate, useSaveTemplate, useAiFillTemplate, getDefaultTemplate, TemplateStructure } from "@/hooks/useCustomTemplates";

interface TimingStep {
  time: string;
  action: string;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
}

const Brief = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pageMode, setPageMode] = useState<"document" | "editor">("document");
  const [showImport, setShowImport] = useState(false);

  const [vigilance, setVigilance] = useState("");
  const [timing, setTiming] = useState<TimingStep[]>([
    { time: "17:00", action: "Arrivée équipe, mise en place" },
    { time: "18:00", action: "Vérification tables & couverts" },
    { time: "19:00", action: "Accueil invités, service cocktail" },
    { time: "20:00", action: "Service entrée" },
    { time: "21:00", action: "Service plat principal" },
    { time: "22:00", action: "Service dessert & café" },
  ]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { label: "Vérifier plan de salle", checked: false },
    { label: "Confirmer nombre de couverts", checked: false },
    { label: "Vérifier régimes spéciaux", checked: false },
    { label: "Tester sono / micro", checked: false },
    { label: "Vérifier stock serviettes", checked: false },
    { label: "Briefer l'équipe de service", checked: false },
  ]);

  // Template system
  const { data: savedTemplate } = useCustomTemplate("maitreHotel");
  const saveTemplate = useSaveTemplate();
  const aiFill = useAiFillTemplate();
  const [templateData, setTemplateData] = useState<TemplateStructure | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    if (savedTemplate) {
      setTemplateData(savedTemplate.structure as unknown as TemplateStructure);
    } else {
      setTemplateData(getDefaultTemplate("maitreHotel"));
    }
  }, [savedTemplate]);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, date, time, venue, guest_count, notes, status, type, client_id")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      if (data) setEvents(data);
    };
    fetchEvents();
  }, [user]);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null); setVigilance(""); setQuote(null); setStaff([]); setClient(null);
      return;
    }
    const ev = events.find((e) => e.id === selectedEventId);
    setSelectedEvent(ev);
    if (ev) {
      const parts: string[] = [];
      if (ev.notes) parts.push(ev.notes);
      setVigilance(parts.join("\n") || "Aucune note logistique pour cet événement.");

      // Fetch quote, staff, client for AI fill
      supabase.from("quotes").select("*").eq("event_id", selectedEventId).order("created_at", { ascending: false }).limit(1)
        .then(({ data }) => setQuote(data?.[0] || null));
      supabase.from("event_staff").select("*, team_members(name, role, phone)").eq("event_id", selectedEventId)
        .then(({ data }) => { if (data) setStaff(data); });
      if (ev.client_id) {
        supabase.from("clients").select("*").eq("id", ev.client_id).single()
          .then(({ data }) => { if (data) setClient(data); });
      } else { setClient(null); }
    }
  }, [selectedEventId, events]);

  const addTimingStep = () => setTiming([...timing, { time: "", action: "" }]);
  const removeTimingStep = (i: number) => setTiming(timing.filter((_, idx) => idx !== i));
  const updateTiming = (i: number, field: keyof TimingStep, val: string) => {
    const copy = [...timing]; copy[i][field] = val; setTiming(copy);
  };
  const addChecklistItem = () => setChecklist([...checklist, { label: "", checked: false }]);
  const removeChecklistItem = (i: number) => setChecklist(checklist.filter((_, idx) => idx !== i));
  const toggleChecklistItem = (i: number) => {
    const copy = [...checklist]; copy[i].checked = !copy[i].checked; setChecklist(copy);
  };
  const updateChecklistLabel = (i: number, val: string) => {
    const copy = [...checklist]; copy[i].label = val; setChecklist(copy);
  };

  // Template operations
  const buildDataset = () => ({
    event: selectedEvent,
    quote: quote ? { items: quote.items, subtotal: quote.subtotal, total_ttc: quote.total_ttc, notes: quote.notes } : null,
    client,
    staff: staff.map((s) => ({ name: (s.team_members as any)?.name, role: (s.team_members as any)?.role, status: s.confirmation_status })),
  });

  const handleAiFill = async () => {
    if (!templateData || !selectedEvent) return;
    const result = await aiFill.mutateAsync({ template: templateData, dataset: buildDataset() });
    setTemplateData(result);
  };

  const handleValidateAll = () => {
    if (!templateData) return;
    setTemplateData({ ...templateData, sections: templateData.sections.map((s) => ({
      ...s, champs: s.champs.map((f) => f.origin === "auto" ? { ...f, origin: "user" as const } : f),
    })) });
  };

  const handleFieldChange = (sIdx: number, fIdx: number, value: string) => {
    if (!templateData) return;
    const sections = [...templateData.sections];
    const champs = [...sections[sIdx].champs];
    champs[fIdx] = { ...champs[fIdx], value, origin: "user" };
    sections[sIdx] = { ...sections[sIdx], champs };
    setTemplateData({ ...templateData, sections });
  };

  const handleFieldValidate = (sIdx: number, fIdx: number) => {
    if (!templateData) return;
    const sections = [...templateData.sections];
    const champs = [...sections[sIdx].champs];
    champs[fIdx] = { ...champs[fIdx], origin: "user" };
    sections[sIdx] = { ...sections[sIdx], champs };
    setTemplateData({ ...templateData, sections });
  };

  const hasAutoFields = templateData?.sections.some((s) => s.champs.some((f) => f.origin === "auto")) || false;
  const handleReset = () => setTemplateData(getDefaultTemplate("maitreHotel"));

  // Editor mode
  if (pageMode === "editor" && templateData) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <TemplateEditor
          template={templateData}
          templateType="maitreHotel"
          onSave={(s) => {
            saveTemplate.mutate({ type: "maitreHotel", structure: s });
            setTemplateData(s);
            setPageMode("document");
          }}
          onBack={() => setPageMode("document")}
          onTestFill={selectedEvent ? handleAiFill : undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Toolbar – hidden on print */}
      <div className="no-print space-y-4">
        <h1 className="text-2xl font-bold">Brief Maître d'Hôtel</h1>
        <p className="text-muted-foreground text-sm">Créez une fiche terrain pour votre maître d'hôtel : allergies en jaune fluo, chronologie du service et checklist logistique. Tout est modifiable avant impression.</p>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Sélectionner un événement" />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name} — {ev.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedEvent && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="gap-2">
                {isEditing ? <><Save className="h-4 w-4" /> Enregistrer</> : <><Edit3 className="h-4 w-4" /> Modifier</>}
              </Button>
              <Button onClick={() => window.print()} className="gap-2 bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                <Printer className="h-4 w-4" /> Imprimer Brief
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedEvent ? (
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-16 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour générer le brief terrain.</p>
        </div>
      ) : (
        <>
          {/* Template Toolbar */}
          <TemplateToolbar
            onAiFill={handleAiFill}
            onValidateAll={handleValidateAll}
            onEditTemplate={() => setPageMode("editor")}
            onImport={() => setShowImport(true)}
            onReset={handleReset}
            isAiFilling={aiFill.isPending}
            hasAutoFields={hasAutoFields}
          />

          {/* ===== PRINTABLE DOCUMENT ===== */}
          <div className="printable-area bg-white p-8 border-4 border-black min-h-[800px] text-black font-sans">
            {/* Header */}
            <div className="flex justify-between border-b-4 border-black pb-4 mb-6">
              <h1 className="text-5xl font-black tracking-tight" style={{ fontFamily: "system-ui, sans-serif" }}>BRIEF</h1>
              <div className="text-right">
                <p className="font-black text-lg">MAÎTRE D'HÔTEL</p>
                <p className="text-sm font-bold">{selectedEvent.date}</p>
                {selectedEvent.venue && <p className="text-sm">{selectedEvent.venue}</p>}
                {selectedEvent.guest_count > 0 && <p className="text-sm font-bold">{selectedEvent.guest_count} couverts</p>}
              </div>
            </div>

            <p className="text-2xl font-black mb-6 uppercase">{selectedEvent.name}</p>

            {/* ===== VIGILANCE SECTION – YELLOW ===== */}
            <div className="mb-8 p-6 shadow-lg" style={{ background: "#ccff00", transform: "rotate(-0.5deg)" }}>
              <h2 className="flex items-center gap-2 font-black uppercase text-sm mb-3 italic">
                <AlertTriangle className="h-5 w-5" fill="black" stroke="black" />
                ⚠ INFORMATIONS PRIORITAIRES — ALLERGIES & LOGISTIQUE
              </h2>
              {isEditing ? (
                <Textarea className="w-full bg-transparent border-2 border-black font-bold text-xl leading-tight min-h-[120px] text-black" value={vigilance} onChange={(e) => setVigilance(e.target.value)} />
              ) : (
                <p className="text-xl font-bold leading-tight uppercase whitespace-pre-line italic">{vigilance}</p>
              )}
            </div>

            {/* ===== TEMPLATE SECTIONS (AI-fillable) ===== */}
            {templateData && (
              <div className="mb-8 space-y-6">
                {templateData.sections.map((section, sIdx) => (
                  <TemplateSectionRenderer
                    key={sIdx}
                    section={section}
                    sectionIndex={sIdx}
                    isEditing={isEditing}
                    onFieldChange={handleFieldChange}
                    onFieldValidate={handleFieldValidate}
                  />
                ))}
              </div>
            )}

            {/* ===== TIMING ===== */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 font-black uppercase border-b-2 border-black pb-2 mb-4 text-base">
                <Clock className="h-5 w-5" /> Chronologie du Service
              </h3>
              <div className="space-y-2">
                {timing.map((step, i) => (
                  <div key={i} className="flex gap-4 items-center border-b border-dotted border-black/30 pb-1">
                    {isEditing ? (
                      <>
                        <Input className="w-20 font-black text-black border-black" value={step.time} onChange={(e) => updateTiming(i, "time", e.target.value)} />
                        <Input className="flex-1 text-black border-black" value={step.action} onChange={(e) => updateTiming(i, "action", e.target.value)} />
                        <button onClick={() => removeTimingStep(i)} className="no-print text-black/40 hover:text-black"><Trash2 className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        <span className="font-black w-20 text-lg">{step.time}</span>
                        <span className="flex-1 font-medium">{step.action}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <button onClick={addTimingStep} className="no-print mt-2 text-sm font-bold flex items-center gap-1 text-black/60 hover:text-black">
                  <Plus className="h-4 w-4" /> Ajouter une étape
                </button>
              )}
            </div>

            {/* ===== CHECKLIST ===== */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 font-black uppercase border-b-2 border-black pb-2 mb-4 text-base">
                <ClipboardList className="h-5 w-5" /> Checklist Logistique
              </h3>
              <div className="space-y-3">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Checkbox checked={item.checked} onCheckedChange={() => toggleChecklistItem(i)} className="h-5 w-5 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white" />
                    {isEditing ? (
                      <>
                        <Input className="flex-1 text-black border-black font-medium" value={item.label} onChange={(e) => updateChecklistLabel(i, e.target.value)} />
                        <button onClick={() => removeChecklistItem(i)} className="no-print text-black/40 hover:text-black"><Trash2 className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <span className={`font-medium text-lg ${item.checked ? "line-through text-black/40" : ""}`}>{item.label}</span>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <button onClick={addChecklistItem} className="no-print mt-2 text-sm font-bold flex items-center gap-1 text-black/60 hover:text-black">
                  <Plus className="h-4 w-4" /> Ajouter un élément
                </button>
              )}
            </div>

            <div className="border-t-2 border-black pt-4 mt-auto">
              <p className="text-xs font-bold text-black/40 uppercase">Document généré par CaterPilot — À imprimer pour le terrain</p>
            </div>
          </div>
        </>
      )}

      {showImport && (
        <ImportTemplateModal
          open={showImport}
          onClose={() => setShowImport(false)}
          templateType="maitreHotel"
          onImported={(structure, filename) => {
            saveTemplate.mutate({ type: "maitreHotel", structure, sourceFilename: filename });
            setTemplateData(structure);
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
};

export default Brief;
