import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getSchedule, type ScheduleItem } from "@/lib/munApi";
import { Calendar, Clock, MapPin } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />
      <section className="pt-36 pb-10 container max-w-5xl">
        <div className="text-center mb-12">
          <p className="section-label">Conference Agenda</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-3">Schedule</h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> All times India Standard Time (IST)
          </p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Calendar className="w-10 h-10 text-primary/30 mx-auto mb-4" />
            <p className="font-semibold mb-1">Schedule being finalised</p>
            <p className="text-xs text-muted-foreground">The Secretariat will publish the agenda shortly.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {Object.entries(grouped).map(([day, list], di) => (
              <div key={day} className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: `${di * 80}ms` }}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="font-display text-xl font-bold">{day}</h2>
                </div>

                <div className="space-y-1">
                  {list.map(it => (
                    <div key={it.id} className="flex gap-4 px-3 py-2.5 rounded-xl hover:bg-primary/4 transition-colors group">
                      <div className="text-right shrink-0 w-16 pt-0.5">
                        <div className="font-display font-bold text-primary text-xs">{it.start_time}</div>
                        {it.end_time && <div className="text-[10px] text-muted-foreground">{it.end_time}</div>}
                      </div>
                      <div className="border-l border-primary/20 pl-4 flex-1 group-hover:border-primary/40 transition-colors">
                        <div className="font-semibold text-sm">{it.title}</div>
                        {it.description && <div className="text-xs text-muted-foreground mt-0.5">{it.description}</div>}
                        {it.location && (
                          <div className="text-[11px] text-primary mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {it.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Schedule;
