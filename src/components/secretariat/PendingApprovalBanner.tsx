// Fullscreen popup blocker for unapproved secretariat accounts.
// Only renders when the user is signed in but NOT yet approved.
import { Clock, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const PendingApprovalBanner = ({ email }: { email: string | null }) => {
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate("/secretariat-login"); };

  return (
    /* Full-screen backdrop — blocks ALL portal access */
    <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center shadow-elegant border-2 border-warning/30 animate-slide-up">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-warning/15 text-warning flex items-center justify-center mx-auto mb-5 animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-warning/10 border border-warning/25">
          <ShieldAlert className="w-3 h-3 text-warning" />
          <span className="text-[10px] font-bold tracking-[0.3em] text-warning uppercase">Pending Approval</span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-3">Access Restricted</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          Your account{email ? <> (<span className="font-semibold text-foreground">{email}</span>)</> : ""} has been created successfully.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          A current Secretariat must grant you access from the <span className="font-semibold text-foreground">Members</span> tab before you can use the Admin Portal.
          Please reach out to the Secretary-General or Director General.
        </p>

        <div className="glass rounded-xl p-4 text-xs text-muted-foreground mb-6 text-left space-y-1">
          <p className="font-semibold text-foreground">What happens next?</p>
          <p>1. A senior Secretariat approves your account</p>
          <p>2. They assign you the correct role &amp; permissions</p>
          <p>3. You receive access — refresh this page to check</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full font-semibold">
            Check again
          </Button>
          <Button variant="ghost" onClick={signOut} className="w-full text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};
