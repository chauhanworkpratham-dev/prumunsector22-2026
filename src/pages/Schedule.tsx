import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getSchedule, type ScheduleItem } from "@/lib/munApi";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TAG_CLASSES: Record<string, string> = {
  CEREMONY:  "tag tag-ceremony",
  COMMITTEE: "tag tag-committee",
  BREAK:     "tag tag-break",
  SOCIAL:    "tag tag-social",
};

const Schedule = () => {
  const { edition } = useActiveEdition();
  const [items, setItems] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (edition) getSchedule(edition.id).then(setItems);
  }, [edition]);

  const grouped = items.reduce<Record<string, ScheduleItem[]>>((acc, it) => {
    (acc[it.day_label] ??= []).push(it);
    return acc;
  }, {});

  /* Placeholder data matching screenshot */
  const placeholder: Record<string, ScheduleItem[]> = {
    "Day 1 · Thursday, August 1": [
      { id:"s1",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"08:30", end_time:"09:30", title:"Registration & Check-in",   description:"Collect your placard and entry pass at the main lobby.", category:"CEREMONY",  sort_order:1 },
      { id:"s2",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"09:30", end_time:"10:30", title:"Opening Ceremony",           description:"Welcome address by the Secretariat and chief guest.",   category:"CEREMONY",  sort_order:2 },
      { id:"s3",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"10:45", end_time:"13:00", title:"Committee Session I",        description:"Opening statements and roll call across all committees.", category:"COMMITTEE", sort_order:3 },
      { id:"s4",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"13:00", end_time:"14:00", title:"Lunch",                      description:undefined as any,                                         category:"BREAK",     sort_order:4 },
      { id:"s5",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"14:00", end_time:"16:30", title:"Committee Session II",       description:"Moderated and unmoderated caucuses.",                     category:"COMMITTEE", sort_order:5 },
      { id:"s6",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"16:45", end_time:"18:00", title:"Crisis Session (UNSC)",      description:"Crisis update introduced; emergency procedures begin.",   category:"COMMITTEE", sort_order:6 },
      { id:"s7",  edition_id:"", day_label:"Day 1 · Thursday, August 1", start_time:"18:30", end_time:"20:00", title:"Delegate Mixer",             description:"Informal networking with refreshments.",                  category:"SOCIAL",    sort_order:7 },
    ],
    "Day 2 · Friday, August 2": [
      { id:"s8",  edition_id:"", day_label:"Day 2 · Friday, August 2", start_time:"09:00", end_time:"11:30", title:"Committee Session III",      description:"Working papers and draft resolutions.",                   category:"COMMITTEE", sort_order:1 },
      { id:"s9",  edition_id:"", day_label:"Day 2 · Friday, August 2", start_time:"11:30", end_time:"13:00", title:"Committee Session IV",       description:"Resolution debate and amendments.",                       category:"COMMITTEE", sort_order:2 },
      { id:"s10", edition_id:"", day_label:"Day 2 · Friday, August 2", start_time:"13:00", end_time:"14:00", title:"Lunch",                      description:undefined as any,                                         category:"BREAK",     sort_order:3 },
      { id:"s11", edition_id:"", day_label:"Day 2 · Friday, August 2", start_time:"14:00", end_time:"16:00", title:"Final Voting Procedure",     description:"Resolutions called to vote in each committee.",           category:"COMMITTEE", sort_order:4 },
      { id:"s12", edition_id:"", day_label:"Day 2 · Friday, August 2", start_time:"16:30", end_time:"18:00", title:"Closing Ceremony & Awards",  description:"Best Delegate, Verbal Mention, and Special Mention awards.", category:"CEREMONY", sort_order:5 },
    ],
  };

  const data = Object.keys(grouped).length > 0 ? grouped : placeholder;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark header */}
      <div className="page-hero">
        <div className="container max-w-4xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Conference Schedule</span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Two days. Every minute mapped.
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-md">
            A live indicator highlights what's happening right now during the conference.
          </p>
        </div>
      </div>

      {/* Schedule grid */}
      <section className="py-16 bg-white">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {Object.entries(data).map(([day, list]) => (
              <div key={day} className="animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-display font-bold text-navy text-xl">{day}</h2>
                  <Clock className="w-4 h-4 text-gold" />
                </div>
                <div className="space-y-0 border border-navy/8 rounded-sm overflow-hidden">
                  {list.map((it, idx) => (
                    <div key={it.id}
                      className={cn("flex gap-0 border-b border-navy/6 last:border-b-0 hover:bg-gold/3 transition-colors", "group")}>
                      {/* Time col */}
                      <div className="w-16 shrink-0 py-4 px-3 border-r border-navy/6 text-right">
                        <div className="font-display font-bold text-navy text-xs leading-none">{it.start_time}</div>
                        {it.end_time && <div className="text-[10px] text-navy/35 mt-0.5">{it.end_time}</div>}
                      </div>
                      {/* Content */}
                      <div className="flex-1 py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-navy flex-1">{it.title}</span>
                          {it.category && (
                            <span className={TAG_CLASSES[it.category] ?? "tag tag-committee"}>
                              {it.category}
                            </span>
                          )}
                        </div>
                        {it.description && (
                          <p className="text-xs text-navy/45 leading-relaxed">{it.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Schedule;
