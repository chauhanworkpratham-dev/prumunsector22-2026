// Persistent banner shown to a signed-in user who is NOT yet a secretariat.
// Lives on /secretariat-login (after a fresh sign-up) and on /secretariat
// (in case they sneak in directly).
import { Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const PendingApprovalBanner = ({ email }: { email: string | null }) => {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/secretariat-login");
  };
  return (
    <div className="glass-strong rounded-3xl p-6 border-2 border-warning/40 bg-warning/5 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-warning/10 blur-3xl pointer-events-none" />
      <div className="flex items-start gap-4 relative">
        <div className="w-12 h-12 rounded-2xl bg-warning/15 text-warning flex items-center justify-center shrink-0 animate-pulse">
          <Clock className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-warning" />
            <p className="text-[10px] tracking-[0.3em] text-warning font-bold">AWAITING APPROVAL</p>
          </div>
          <h3 className="font-display text-xl font-bold mb-1">Waiting for Secretariat Approval</h3>
          <p className="text-sm text-muted-foreground">
            {email ? <>Your account <span className="font-semibold text-foreground">({email})</span> has been created.</> : <>Your account has been created.</>}
            {" "}A current Secretariat must grant you access from the Members tab before you can use the console.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
