import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail, Bot, Send, X, AlertTriangle, Trophy, ChevronDown, ChevronUp,
  Flame, RefreshCcw, UserCheck, Calendar, Users, DollarSign, Sparkles, Info
} from "lucide-react";
import { useFetchUnreadEmails, useAnalyzeEmail, useSendEmailResponse, useEmailSettings } from "@/hooks/useEmails";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

const categoryLabels: Record<string, string> = {
  new_lead: "Nouvelle demande",
  modification: "Modification",
  cancellation: "Annulation",
  question: "Question",
};

const categoryColors: Record<string, string> = {
  new_lead: "bg-status-confirmed/12 text-status-confirmed",
  modification: "bg-status-appointment/12 text-status-appointment",
  cancellation: "bg-destructive/12 text-destructive",
  question: "bg-muted text-muted-foreground",
};

const eventTypeLabels: Record<string, string> = {
  wedding: "Mariage",
  birthday: "Anniversaire",
  corporate: "Entreprise",
  private: "Privé",
  other: "Autre",
};

type EmailData = {
  id: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  body: string;
  received_at: string;
  analysis?: any;
};

type GroupedEmails = {
  sender_email: string;
  sender_name: string;
  emails: EmailData[];
  latest_subject: string;
  latest_received: string;
};

const MailPage = () => {
  const { data: emailData, isLoading, refetch } = useFetchUnreadEmails();
  const { data: emailSettings } = useEmailSettings();
  const analyzeEmail = useAnalyzeEmail();
  const sendResponse = useSendEmailResponse();
  const navigate = useNavigate();

  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [localAnalysis, setLocalAnalysis] = useState<Record<string, any>>({});
  const [showBanner, setShowBanner] = useState(() => localStorage.getItem("email_banner_dismissed") !== "true");
  const [postSendModal, setPostSendModal] = useState<any | null>(null);

  const emails = emailData?.emails || [];
  const isConnected = emailData?.connected || false;

  // Group emails by sender
  const groupedEmails = useMemo(() => {
    const groups: Record<string, GroupedEmails> = {};
    for (const email of emails) {
      const key = email.sender_email;
      if (!groups[key]) {
        groups[key] = {
          sender_email: email.sender_email,
          sender_name: email.sender_name,
          emails: [],
          latest_subject: email.subject,
          latest_received: email.received_at,
        };
      }
      groups[key].emails.push(email);
      if (new Date(email.received_at) > new Date(groups[key].latest_received)) {
        groups[key].latest_subject = email.subject;
        groups[key].latest_received = email.received_at;
      }
    }
    return Object.values(groups).sort(
      (a, b) => new Date(b.latest_received).getTime() - new Date(a.latest_received).getTime()
    );
  }, [emails]);

  // Auto-analyze if triage is ON
  useEffect(() => {
    if (emailSettings?.auto_triage_enabled && emails.length > 0) {
      for (const email of emails) {
        if (!email.analysis && !analyzingIds.has(email.id) && !localAnalysis[email.id]) {
          handleAnalyze(email);
        }
      }
    }
  }, [emailSettings?.auto_triage_enabled, emails]);

  const handleAnalyze = async (email: EmailData) => {
    setAnalyzingIds((prev) => new Set(prev).add(email.id));
    try {
      const result = await analyzeEmail.mutateAsync({
        email_id: email.id,
        sender_email: email.sender_email,
        sender_name: email.sender_name,
        subject: email.subject,
        body: email.body,
        received_at: email.received_at,
      });
      setLocalAnalysis((prev) => ({ ...prev, [email.id]: result }));
      if (result.suggested_response) {
        setResponses((prev) => ({ ...prev, [email.id]: result.suggested_response }));
      }
      setExpandedEmail(email.id);
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(email.id);
        return next;
      });
    }
  };

  const handleSend = async (email: EmailData) => {
    const responseText = responses[email.id];
    if (!responseText?.trim()) {
      toast.error("La réponse ne peut pas être vide");
      return;
    }
    await sendResponse.mutateAsync({
      email_provider_id: email.id,
      reply_to_email: email.sender_email,
      subject: email.subject,
      body: responseText,
      original_message_id: email.id,
    });

    const analysis = getAnalysis(email);
    if (analysis?.category === "new_lead") {
      setPostSendModal({
        sender_name: email.sender_name,
        sender_email: email.sender_email,
        analysis,
      });
    }
    setExpandedEmail(null);
  };

  const getAnalysis = (email: EmailData) => localAnalysis[email.id] || email.analysis;

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("email_banner_dismissed", "true");
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📧 Boîte de réception intelligente</h1>
          <p className="text-muted-foreground text-sm">
            Analysez vos emails avec l'IA, obtenez des réponses personnalisées et gérez vos prospects en un clic.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Actualiser
        </Button>
      </div>

      {/* Welcome banner */}
      {showBanner && (
        <Card className="rounded-2xl bg-primary/5 border-primary/20">
          <CardContent className="p-4 relative">
            <button onClick={dismissBanner} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-semibold">💡 Bienvenue dans votre boîte de réception intelligente</p>
                <p className="text-muted-foreground">
                  1️⃣ Vos emails non lus apparaissent ici · 
                  2️⃣ Cliquez sur "🤖 Analyser" pour activer l'assistant IA · 
                  3️⃣ Modifiez la réponse suggérée si besoin · 
                  4️⃣ Validez l'envoi en un clic
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection status */}
      {!isConnected && (
        <Card className="rounded-2xl border-status-quote-sent/30 bg-status-quote-sent/5">
          <CardContent className="p-6 text-center space-y-3">
            <Mail className="h-10 w-10 mx-auto text-status-quote-sent" />
            <p className="font-semibold">Aucune boîte mail connectée</p>
            <p className="text-sm text-muted-foreground">Rendez-vous dans Paramètres pour connecter votre Gmail ou Outlook.</p>
            <Button variant="accent" onClick={() => navigate("/settings")}>Connecter ma boîte mail</Button>
          </CardContent>
        </Card>
      )}

      {emailData?.error === "token_expired" && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm">Votre token a expiré. Reconnectez votre boîte mail dans les Paramètres.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>Paramètres</Button>
          </CardContent>
        </Card>
      )}

      {/* Email list */}
      {isConnected && emails.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">Aucun email non lu</p>
            <p className="text-sm text-muted-foreground">Tous vos emails ont été traités. Bravo ! 🎉</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {groupedEmails.map((group) => {
          const isGroupExpanded = expandedGroup === group.sender_email;
          const isSingleEmail = group.emails.length === 1;

          if (isSingleEmail) {
            return <EmailCard key={group.emails[0].id} email={group.emails[0]} expandedEmail={expandedEmail} setExpandedEmail={setExpandedEmail} analyzingIds={analyzingIds} handleAnalyze={handleAnalyze} handleSend={handleSend} responses={responses} setResponses={setResponses} getAnalysis={getAnalysis} timeAgo={timeAgo} sendResponse={sendResponse} />;
          }

          return (
            <Card key={group.sender_email} className="rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isGroupExpanded ? null : group.sender_email)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {group.sender_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{group.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{group.emails.length} messages · {group.latest_subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{timeAgo(group.latest_received)}</span>
                  {isGroupExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              {isGroupExpanded && (
                <div className="border-t divide-y">
                  {group.emails.map((email) => (
                    <EmailCard key={email.id} email={email} expandedEmail={expandedEmail} setExpandedEmail={setExpandedEmail} analyzingIds={analyzingIds} handleAnalyze={handleAnalyze} handleSend={handleSend} responses={responses} setResponses={setResponses} getAnalysis={getAnalysis} timeAgo={timeAgo} sendResponse={sendResponse} nested />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Post-send modal for new leads */}
      <Dialog open={!!postSendModal} onOpenChange={() => setPostSendModal(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>✅ Réponse envoyée !</DialogTitle>
            <DialogDescription>
              {postSendModal?.sender_name} · {postSendModal?.sender_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">Voulez-vous créer un devis maintenant ?</p>
            <div className="bg-muted rounded-xl p-3 text-sm space-y-1">
              <p>→ Client : {postSendModal?.sender_name}</p>
              <p>→ Type : {eventTypeLabels[postSendModal?.analysis?.extracted_info?.event_type] || "Autre"}</p>
              <p>→ Couverts : {postSendModal?.analysis?.extracted_info?.guest_count || "Non précisé"}</p>
              <p>→ Budget : {postSendModal?.analysis?.extracted_info?.budget ? `${postSendModal.analysis.extracted_info.budget}€` : "Non précisé"}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPostSendModal(null)}>Plus tard</Button>
            <Button
              variant="accent"
              onClick={() => {
                const a = postSendModal?.analysis;
                navigate(`/quotes?client_id=${a?.client_id || ""}&event_type=${a?.extracted_info?.event_type || ""}&guest_count=${a?.extracted_info?.guest_count || ""}&budget=${a?.extracted_info?.budget || ""}`);
                setPostSendModal(null);
              }}
            >
              Créer le devis →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function EmailCard({
  email, expandedEmail, setExpandedEmail, analyzingIds, handleAnalyze, handleSend,
  responses, setResponses, getAnalysis, timeAgo, sendResponse, nested = false,
}: {
  email: EmailData;
  expandedEmail: string | null;
  setExpandedEmail: (id: string | null) => void;
  analyzingIds: Set<string>;
  handleAnalyze: (e: EmailData) => void;
  handleSend: (e: EmailData) => void;
  responses: Record<string, string>;
  setResponses: (fn: any) => void;
  getAnalysis: (e: EmailData) => any;
  timeAgo: (d: string) => string;
  sendResponse: any;
  nested?: boolean;
}) {
  const analysis = getAnalysis(email);
  const isExpanded = expandedEmail === email.id;
  const isAnalyzing = analyzingIds.has(email.id);

  return (
    <Card className={cn("rounded-2xl overflow-hidden transition-all", nested && "rounded-none shadow-none border-0")}>
      {/* Urgent badge */}
      {analysis?.is_urgent && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <span className="text-xs font-bold text-destructive">EMAIL URGENT — Répondre rapidement</span>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!nested && (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {email.sender_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{email.sender_name}</p>
              <p className="text-xs text-muted-foreground truncate">{email.sender_email}</p>
              <p className="text-sm mt-1 font-medium truncate">Objet : {email.subject}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(email.received_at)}</span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">"{email.body?.substring(0, 200)}..."</p>

        {/* Analysis section */}
        {isAnalyzing && (
          <div className="space-y-2 animate-pulse">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", categoryColors[analysis.category] || "bg-muted text-muted-foreground")}>
                📨 {categoryLabels[analysis.category] || analysis.category}
              </span>
              {analysis.is_urgent && <Badge variant="destructive" className="text-xs">🔥 Urgent</Badge>}
              {analysis.is_recurring_client && <Badge variant="secondary" className="text-xs bg-status-confirmed/12 text-status-confirmed">🔄 Client récurrent</Badge>}
            </div>

            {/* Extracted info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {analysis.extracted_info?.event_type && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{eventTypeLabels[analysis.extracted_info.event_type] || analysis.extracted_info.event_type}</span>
                </div>
              )}
              {analysis.extracted_info?.guest_count && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{analysis.extracted_info.guest_count} couverts</span>
                </div>
              )}
              {analysis.extracted_info?.budget && (
                <div className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{analysis.extracted_info.budget}€{analysis.extracted_info.budget_per_person ? ` (${analysis.extracted_info.budget_per_person}€/pers)` : ""}</span>
                </div>
              )}
              {analysis.extracted_info?.date_period && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{analysis.extracted_info.date_period}</span>
                </div>
              )}
            </div>

            {/* Calendar conflict */}
            {analysis.calendar_check?.has_conflict && (
              <div className="bg-status-quote-sent/10 border border-status-quote-sent/30 rounded-xl p-3">
                <p className="text-xs font-bold text-status-quote-sent flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> CONFLIT DE PLANNING DÉTECTÉ
                </p>
                {analysis.calendar_check.conflicting_events?.map((ev: any, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground mt-1">→ {ev.name} ({ev.date}) - {ev.status}</p>
                ))}
              </div>
            )}

            {/* Upsell suggestions */}
            {analysis.upsell_suggestions?.length > 0 && (
              <div className="bg-primary/5 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Opportunités d'upsell</p>
                {analysis.upsell_suggestions.map((s: any, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">• {s.item} — {s.reason} {s.estimated_price && `(${s.estimated_price})`}</p>
                ))}
              </div>
            )}

            {/* Editable response */}
            {isExpanded && (
              <div className="space-y-2">
                <p className="text-xs font-semibold">✏️ Réponse suggérée :</p>
                <Textarea
                  value={responses[email.id] || analysis.suggested_response || ""}
                  onChange={(e) => setResponses((prev: any) => ({ ...prev, [email.id]: e.target.value }))}
                  className="min-h-[200px] resize-y text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    className="flex-1 gap-2"
                    onClick={() => handleSend(email)}
                    disabled={sendResponse.isPending}
                  >
                    <Send className="h-4 w-4" /> Valider et envoyer
                  </Button>
                  <Button variant="outline" onClick={() => setExpandedEmail(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!isExpanded && analysis && (
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => {
                if (!responses[email.id] && analysis.suggested_response) {
                  setResponses((prev: any) => ({ ...prev, [email.id]: analysis.suggested_response }));
                }
                setExpandedEmail(email.id);
              }}>
                <Send className="h-3.5 w-3.5" /> Voir la réponse suggérée
              </Button>
            )}
          </div>
        )}

        {/* Analyze button */}
        {!analysis && !isAnalyzing && (
          <Button variant="accent" size="sm" className="gap-2" onClick={() => handleAnalyze(email)}>
            <Bot className="h-4 w-4" /> Analyser avec l'IA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default MailPage;
