import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { MapPin, Navigation, Phone, Mail, Clock } from "lucide-react";
import { VENUE } from "@/lib/munData";

const Venue = () => {
  const { edition } = useActiveEdition();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark header */}
      <div className="page-hero">
        <div className="container max-w-4xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Conference Venue</span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Where diplomacy meets education.
          </h1>
          <p className="text-white/50 text-sm mt-3">
            Prudence International School proudly hosts {edition?.name ?? "PRUMUN 2026"}.
          </p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map — takes 2 cols */}
            <div className="lg:col-span-2 border border-navy/8 rounded-sm overflow-hidden shadow-card">
              <div className="aspect-[4/3] w-full">
                <iframe
                  title="Prudence School Sector 22 Dwarka"
                  src={`https://www.google.com/maps?q=${VENUE.mapsQuery}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Info panel */}
            <div className="space-y-4">
              <div className="border border-navy/8 rounded-sm p-5 shadow-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-sm bg-navy flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy text-sm">{VENUE.name}</h3>
                    <p className="text-navy/50 text-xs mt-0.5">{VENUE.address}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${VENUE.mapsQuery}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-gold w-full justify-center text-xs">
                  <Navigation className="w-3.5 h-3.5" /> Get directions
                </a>
              </div>

              <div className="border border-navy/8 rounded-sm p-5 shadow-card space-y-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy">Conference hours</p>
                    <p className="text-xs text-navy/45">8:30 AM – 8:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy">Helpline</p>
                    <p className="text-xs text-navy/45">+91 11 2807 0000</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy">Secretariat</p>
                    <p className="text-xs text-navy/45">secretariat@prumun.org</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Venue;
