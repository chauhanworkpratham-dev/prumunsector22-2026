// Shared UI atoms for registration flows.
import { Check, Upload, FileText, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Stepper = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="glass-strong rounded-2xl p-4 mb-8">
    <div className="flex items-center justify-between">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0",
            current >= i ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
          )}>
            {current > i ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <div className="ml-3 hidden sm:block">
            <div className={cn("text-xs font-semibold", current >= i ? "text-foreground" : "text-muted-foreground")}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-3 transition-all", current > i ? "bg-gradient-primary" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  </div>
);

export const BasicInfoFields = ({ values, onChange }: {
  values: { fullName: string; email: string; school: string; grade: string; phone: string };
  onChange: (v: typeof values) => void;
}) => (
  <div className="grid md:grid-cols-2 gap-4">
    <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={values.fullName} onChange={e => onChange({ ...values, fullName: e.target.value })} placeholder="Aarav Sharma" maxLength={80} /></div>
    <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={values.email} onChange={e => onChange({ ...values, email: e.target.value })} placeholder="you@example.com" maxLength={120} /></div>
    <div className="space-y-1.5"><Label htmlFor="school">School / Organisation</Label><Input id="school" value={values.school} onChange={e => onChange({ ...values, school: e.target.value })} placeholder="Prudence School Dwarka" maxLength={120} /></div>
    <div className="space-y-1.5"><Label htmlFor="grade">Grade / Class</Label><Input id="grade" value={values.grade} onChange={e => onChange({ ...values, grade: e.target.value })} placeholder="11" maxLength={20} /></div>
    <div className="md:col-span-2 space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" value={values.phone} onChange={e => onChange({ ...values, phone: e.target.value.replace(/[^\d+\s-]/g, "") })} placeholder="+91 98XXXXXXXX" maxLength={20} /></div>
  </div>
);

export const validateBasicInfo = (v: { fullName: string; email: string; school: string; grade: string; phone: string }) =>
  v.fullName.trim() && /\S+@\S+\.\S+/.test(v.email) && v.school.trim() && v.grade.trim() && v.phone.trim().length >= 10;

export const IdUploader = ({ idFile, setIdFile }: {
  idFile: File | null; setIdFile: (f: File | null) => void;
}) => {
  const inp = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [type, setType] = useState<"image" | "pdf" | "">("");

  const onFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5 MB.", variant: "destructive" });
      return;
    }
    const isImg = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImg && !isPdf) {
      toast({ title: "Invalid file", description: "Upload an image or PDF.", variant: "destructive" });
      return;
    }
    setIdFile(file);
    setType(isImg ? "image" : "pdf");
    if (isImg) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else setPreview("");
  };

  return (
    <>
      <input ref={inp} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {!idFile ? (
        <button onClick={() => inp.current?.click()}
          className="w-full glass rounded-3xl p-10 border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all group">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <p className="font-semibold text-lg">Click to upload your photo / ID</p>
          <p className="text-sm text-muted-foreground mt-1">Image (JPG, PNG) or PDF · max 5 MB</p>
        </button>
      ) : (
        <div className="glass rounded-3xl p-6">
          <div className="flex items-start gap-4">
            {type === "image" && preview ? (
              <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-2xl border-2 border-primary/30" />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                <FileText className="w-12 h-12 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-success font-semibold mb-1">
                <Check className="w-4 h-4" /> Ready to upload
              </div>
              <p className="text-sm font-medium truncate">{idFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{type} file</p>
              <button onClick={() => { setIdFile(null); setPreview(""); setType(""); }} className="text-xs text-destructive hover:underline mt-3 inline-flex items-center gap-1">
                <X className="w-3 h-3" /> Remove and re-upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
