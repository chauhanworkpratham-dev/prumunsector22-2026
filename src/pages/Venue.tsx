import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VENUE } from "@/lib/munData";
import { MapPin, Navigation, Train, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

const Venue = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-36 pb-12 container max-w-5xl">
      <div className="text-center mb-10">
        <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">THE STAGE</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-4">Venue</h1>
        <p className="text-muted-foreground text-lg">Where diplomacy meets debate.</p>
      </div>

      <div className="glass-strong rounded-3xl overflow-hidden mb-8">
        <div className="aspect-video w-full">
          <iframe
            title="Prudence Sector 22 Dwarka location"
            src={`https://www.google.com/maps?q=${VENUE.mapsQuery}&output=embed`}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">{VENUE.name}</h2>
              <p className="text-muted-foreground">{VENUE.address}</p>
            </div>
          </div>
          <Button asChild variant="hero">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${VENUE.mapsQuery}`} target="_blank" rel="noopener noreferrer">
              <Navigation className="w-4 h-4" /> Get Directions
            </a>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6 hover-lift">
          <Train className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-display text-xl font-bold mb-2">By Metro</h3>
          <p className="text-sm text-muted-foreground">Nearest station: Dwarka Sector 21 (Blue Line / Airport Express). 7 min by auto from the station.</p>
        </div>
        <div className="glass rounded-3xl p-6 hover-lift">
          <Car className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-display text-xl font-bold mb-2">By Car</h3>
          <p className="text-sm text-muted-foreground">Ample on-site parking. 25 min from IGI Airport, 45 min from central New Delhi.</p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Venue;
