// Shared UI atoms for registration flows — light design system
import { Check, Upload, FileText, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ── Step progress bar ── */
export const Stepper = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="border border-navy/8 rounded-sm p-4 mb-8 bg-white shadow-card">
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 border",
            current > i  ? "bg-navy border-navy text-white" :
            current === i ? "bg-gold border-gold text-white" :
                            "bg-white border-navy/20 text-navy/40"
          )}>
            {current > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <div className="ml-2.5 hidden sm:block">
            <div className={cn(
              "text-xs font-semibold leading-none",
              current >= i ? "text-navy" : "text-navy/35"
            )}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-px mx-3 transition-all",
              current > i ? "bg-navy/30" : "bg-navy/10"
            )} />
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ── Basic info fields ── */
export const BasicInfoFields = ({ values, onChange }: {
  values: { fullName: string; email: string; school: string; grade: string; phone: string };
  onChange: (v: typeof values) => void;
}) => (
  <div className="grid md:grid-cols-2 gap-4">
    <div className="space-y-1.5">
      <Label htmlFor="name" className="text-xs font-semibold text-navy/60">Full name</Label>
      <Input id="name" value={values.fullName} onChange={e => onChange({ ...values, fullName: e.target.value })}
        placeholder="Aarav Sharma" maxLength={80}
        className="border-navy/15 focus:border-gold focus:ring-gold/20 text-navy placeholder:text-navy/30" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-xs font-semibold text-navy/60">Email</Label>
      <Input id="email" type="email" value={values.email} onChange={e => onChange({ ...values, email: e.target.value })}
        placeholder="you@example.com" maxLength={120}
        className="border-navy/15 focus:border-gold focus:ring-gold/20 text-navy placeholder:text-navy/30" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="school" className="text-xs font-semibold text-navy/60">School / Organisation</Label>
      <Input id="school" value={values.school} onChange={e => onChange({ ...values, school: e.target.value })}
        placeholder="Prudence School Dwarka" maxLength={120}
        className="border-navy/15 focus:border-gold focus:ring-gold/20 text-navy placeholder:text-navy/30" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="grade" className="text-xs font-semibold text-navy/60">Grade / Class</Label>
      <Input id="grade" value={values.grade} onChange={e => onChange({ ...values, grade: e.target.value })}
        placeholder="11" maxLength={20}
        className="border-navy/15 focus:border-gold focus:ring-gold/20 text-navy placeholder:text-navy/30" />
    </div>
    <div className="md:col-span-2 space-y-1.5">
      <Label htmlFor="phone" className="text-xs font-semibold text-navy/60">Phone</Label>
      <Input id="phone" value={values.phone}
        onChange={e => onChange({ ...values, phone: e.target.value.replace(/[^\d+\s-]/g, "") })}
        placeholder="+91 98XXXXXXXX" maxLength={20}
        className="border-navy/15 focus:border-gold focus:ring-gold/20 text-navy placeholder:text-navy/30" />
    </div>
  </div>
);

export const validateBasicInfo = (v: { fullName: string; email: string; school: string; grade: string; phone: string }) =>
  v.fullName.trim() && /\S+@\S+\.\S+/.test(v.email) && v.school.trim() && v.grade.trim() && v.phone.trim().length >= 10;

/* ── ID uploader ── */
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
          className="w-full border-2 border-dashed border-navy/15 hover:border-gold/50 hover:bg-gold/3 rounded-sm p-10 transition-all group text-center">
          <div className="w-14 h-14 mx-auto rounded-sm bg-navy flex items-center justify-center mb-4 group-hover:bg-navy-mid transition-colors">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <p className="font-semibold text-navy text-sm">Click to upload your photo / ID</p>
          <p className="text-xs text-navy/40 mt-1">Image (JPG, PNG) or PDF · max 5 MB</p>
        </button>
      ) : (
        <div className="border border-navy/8 rounded-sm p-5 bg-white shadow-card">
          <div className="flex items-start gap-4">
            {type === "image" && preview ? (
              <img src={preview} alt="Preview" className="w-28 h-28 object-cover rounded-sm border border-navy/10" />
            ) : (
              <div className="w-28 h-28 rounded-sm bg-gold/10 flex items-center justify-center border border-gold/20">
                <FileText className="w-10 h-10 text-gold" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-green-600 font-semibold text-sm mb-1">
                <Check className="w-4 h-4" /> Ready to upload
              </div>
              <p className="text-sm font-medium text-navy truncate">{idFile.name}</p>
              <p className="text-xs text-navy/40 mt-1 capitalize">{type} file</p>
              <button onClick={() => { setIdFile(null); setPreview(""); setType(""); }}
                className="text-xs text-red-500 hover:text-red-700 hover:underline mt-3 inline-flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Remove and re-upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
