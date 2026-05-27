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
    (acc[it.day_label] ||= []).push(it);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-5xl">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">CONFERENCE AGENDA</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-4">Schedule</h1>
          <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> All times IST
          </p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="glass rounded-3xl p-16 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">Schedule is being finalised</p>
            <p className="text-sm text-muted-foreground">Check back soon — the secretariat will publish the agenda shortly.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {Object.entries(grouped).map(([day, list]) => (
              <div key={day} className="glass-strong rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">{day}</h2>
                </div>
                <div className="space-y-1">
                  {list.map(it => (
                    <div key={it.id} className="flex gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors">
                      <div className="text-right shrink-0 w-20">
                        <div className="font-display font-bold text-primary text-sm">{it.start_time}</div>
                        {it.end_time && <div className="text-[10px] text-muted-foreground">{it.end_time}</div>}
                      </div>
                      <div className="border-l-2 border-primary/30 pl-4 flex-1">
                        <div className="font-semibold">{it.title}</div>
                        {it.description && <div className="text-sm text-muted-foreground">{it.description}</div>}
                        {it.location && <div className="text-xs text-primary mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {it.location}</div>}
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
