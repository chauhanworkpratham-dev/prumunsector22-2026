import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { VENUE } from "@/lib/munData";
import { MapPin, Navigation, Train, Car } from "lucide-react";

const Venue = () => (
  <div className="min-h-screen bg-background mesh-bg">
    <Navbar />
    <section className="pt-36 pb-12 container max-w-5xl">
      <div className="text-center mb-10">
        <p className="section-label">The Stage</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-3">Venue</h1>
        <p className="text-muted-foreground text-sm">Where diplomacy meets debate.</p>
      </div>

      {/* Map */}
      <div className="glass rounded-2xl overflow-hidden mb-6 shadow-card">
        <div className="aspect-video w-full">
          <iframe
            title="Prudence School Sector 22 Dwarka"
            src={`https://www.google.com/maps?q=${VENUE.mapsQuery}&output=embed`}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary text-white flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{VENUE.name}</h2>
              <p className="text-sm text-muted-foreground">{VENUE.address}</p>
            </div>
          </div>
          <Button asChild className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${VENUE.mapsQuery}`}
              target="_blank" rel="noopener noreferrer">
              <Navigation className="w-4 h-4" /> Get Directions
            </a>
          </Button>
        </div>
      </div>

      {/* Getting here */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 hover-lift">
          <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-4">
            <Train className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg mb-2">By Metro</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nearest station: <span className="font-semibold text-foreground">Dwarka Sector 21</span> (Blue Line / Airport Express).
            Approx. 7 minutes by auto-rickshaw from the station.
          </p>
        </div>
        <div className="glass rounded-2xl p-6 hover-lift">
          <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-4">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg mb-2">By Car</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ample on-site parking available.{" "}
            <span className="font-semibold text-foreground">25 min</span> from IGI Airport,{" "}
            <span className="font-semibold text-foreground">45 min</span> from central New Delhi.
          </p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Venue;
