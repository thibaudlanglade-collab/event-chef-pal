import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Upload, Save } from "lucide-react";
import { useUserProfile, useUpdateUserProfile, useUploadLogo } from "@/hooks/useUserProfile";

export default function CompanySettings() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const uploadLogo = useUploadLogo();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    siret: "",
    quote_validity_days: 30,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: (profile as any).address || "",
        siret: (profile as any).siret || "",
        quote_validity_days: (profile as any).quote_validity_days ?? 30,
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(form as any);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo.mutate(file);
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Informations de l'entreprise
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ces informations apparaîtront sur vos devis et documents.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl border-2 border-dashed border-input flex items-center justify-center overflow-hidden bg-muted/30">
            {(profile as any)?.logo_url ? (
              <img src={(profile as any).logo_url} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploadLogo.isPending}>
              <Upload className="h-3.5 w-3.5" /> {uploadLogo.isPending ? "Envoi…" : "Charger un logo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, max 2 Mo</p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>

        {/* Company name + SIRET */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Nom de l'entreprise *</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>SIRET / N° entreprise</Label>
            <Input
              value={form.siret}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
                const formatted = digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
                setForm({ ...form, siret: formatted });
              }}
              placeholder="123 456 789 00012"
              className="mt-1"
              maxLength={17}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Prénom</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Nom</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" className="mt-1" />
          </div>
        </div>

        {/* Address */}
        <div>
          <Label>Adresse complète</Label>
          <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 rue de l'Exemple, 75001 Paris" className="mt-1" rows={2} />
        </div>

        {/* Quote validity */}
        <div className="max-w-xs">
          <Label>Durée de validité des devis (jours)</Label>
          <Input type="number" min={1} max={365} value={form.quote_validity_days} onChange={(e) => setForm({ ...form, quote_validity_days: Number(e.target.value) })} className="mt-1" />
        </div>

        <Button className="gap-2" onClick={handleSave} disabled={updateProfile.isPending}>
          <Save className="h-4 w-4" /> {updateProfile.isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
}
