import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{
    type: "email_exists" | "generic" | null;
    message: string;
  }>({ type: null, message: "" });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError({ type: null, message: "" });

    if (password.length < 8) {
      setAuthError({ type: "generic", message: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    if (password !== confirmPassword) {
      setAuthError({ type: "generic", message: "Les mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: `${firstName} ${lastName}`,
            company_name: companyName,
          },
        },
      });

      if (error) {
        if (
          error.message.includes("already registered") ||
          error.message.includes("User already exists") ||
          error.status === 422
        ) {
          setAuthError({ type: "email_exists", message: "Un compte existe déjà avec cet email." });
        } else {
          setAuthError({ type: "generic", message: error.message });
        }
      } else {
        toast.success("Compte créé ! Vérifiez vos emails pour confirmer votre adresse.");
        navigate(`/login?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setAuthError({ type: "generic", message: "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 50%))" }}
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="CaterPilot" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-xl font-bold text-white">CaterPilot</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Lancez-vous en<br />quelques minutes.
          </h1>
          <p className="mt-4 text-white/70 text-lg max-w-md">
            Créez votre compte et commencez à gérer vos événements dès aujourd'hui.
          </p>
        </div>
        <p className="text-white/40 text-sm">© 2026 CaterPilot</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logo} alt="CaterPilot" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-xl font-bold">CaterPilot</span>
          </div>

          <h2 className="text-2xl font-bold">Créer votre compte CaterPilot</h2>
          <p className="text-muted-foreground mt-1">Gérez votre activité traiteur en toute simplicité.</p>

          {/* Email exists warning */}
          {authError.type === "email_exists" && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Cette adresse email est déjà utilisée
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Un compte existe déjà avec cet email. Souhaitez-vous vous connecter ?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                    onClick={() => navigate(`/login?email=${encodeURIComponent(email)}`)}
                  >
                    Se connecter <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Generic error */}
          {authError.type === "generic" && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive animate-fade-in">
              {authError.message}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom de l'entreprise *</label>
              <Input
                type="text"
                placeholder="Ex: Les Saveurs du Sud"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11 bg-muted/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Prénom *</label>
                <Input
                  type="text"
                  placeholder="Marc"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-11 bg-muted/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nom *</label>
                <Input
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-11 bg-muted/30"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email professionnel *</label>
              <Input
                type="email"
                placeholder="marc@saveurs-sud.fr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError.type === "email_exists") setAuthError({ type: null, message: "" });
                }}
                required
                className="h-11 bg-muted/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Mot de passe *</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-muted/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirmer le mot de passe *</label>
              <Input
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 bg-muted/30"
              />
            </div>

            <Button type="submit" variant="accent" className="w-full h-11" disabled={loading}>
              {loading ? "Création en cours..." : "Créer mon compte"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
