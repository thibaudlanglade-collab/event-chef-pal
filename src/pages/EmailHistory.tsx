import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Search, Eye, X, Calendar, Users, DollarSign } from "lucide-react";
import { useEmailHistory } from "@/hooks/useEmails";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const EmailHistory = () => {
  const { data: emails, isLoading } = useEmailHistory();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = (emails || []).filter((email: any) => {
    const matchSearch = !search || 
      email.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
      email.sender_email?.toLowerCase().includes(search.toLowerCase()) ||
      email.subject?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || email.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📋 Historique des emails</h1>
        <p className="text-muted-foreground text-sm">Retrouvez tous vos emails traités avec les réponses envoyées et les analyses effectuées.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou objet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="new_lead">Nouvelle demande</SelectItem>
            <SelectItem value="modification">Modification</SelectItem>
            <SelectItem value="cancellation">Annulation</SelectItem>
            <SelectItem value="question">Question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email list */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            Aucun email traité trouvé.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((email: any) => {
            const isExpanded = expandedId === email.id;
            const info = email.extracted_info as any;
            return (
              <Card key={email.id} className="rounded-2xl">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-status-confirmed/10 flex items-center justify-center text-status-confirmed shrink-0">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{email.sender_name}</p>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", categoryColors[email.category] || "bg-muted text-muted-foreground")}>
                            {categoryLabels[email.category] || email.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{email.subject}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        Envoyé le {new Date(email.response_sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-1 gap-1 text-xs h-7" onClick={() => setExpandedId(isExpanded ? null : email.id)}>
                        {isExpanded ? <X className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {isExpanded ? "Fermer" : "Voir la réponse"}
                      </Button>
                    </div>
                  </div>

                  {/* Extracted info summary */}
                  {info && (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {info.guest_count && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{info.guest_count} couverts</span>}
                      {info.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{info.budget}€</span>}
                      {info.date_period && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{info.date_period}</span>}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Email original :</p>
                        <div className="bg-muted rounded-xl p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{email.body}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Réponse envoyée :</p>
                        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-sm whitespace-pre-wrap">{email.final_response_text || email.suggested_response}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmailHistory;
