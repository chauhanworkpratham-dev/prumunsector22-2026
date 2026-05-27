import { useEffect, useState } from "react";
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getContactPersons, type ContactPerson } from "@/lib/munApi";
import crest from "@/assets/prumun-crest.png";

const SOCIALS = {
  instagram: "https://www.instagram.com/prumun_2.0?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  facebook: "https://www.facebook.com/prudenceschoolsdelhi/",
  youtube: "https://www.youtube.com/@PrudenceSchools",
};

export const Footer = () => {
  const { edition } = useActiveEdition();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  useEffect(() => {
    if (!edition) return;
    getContactPersons(edition.id).then(setContacts);
  }, [edition]);

  return (
    <>
      <footer className="mt-32 border-t border-border bg-gradient-to-b from-transparent to-secondary/40">
        <div className="container py-16">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-primary-glow/20 ring-2 ring-primary/30 shadow-soft flex items-center justify-center">
                  <img src={crest} alt="" width={48} height={48} className="w-12 h-12 object-contain drop-shadow-md" />
                </div>
                <div>
                  <div className="font-display font-bold text-2xl gradient-text-deep">{edition?.name ?? "PRUMUN 2026"}</div>
                  <div className="text-xs tracking-widest text-muted-foreground">DIPLOMACY · DEBATE · DESTINY</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                The premier Model United Nations conference, fostering diplomacy, debate, and global awareness in the next generation of leaders.
              </p>
              <div className="flex gap-3 mt-6">
                <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover-lift" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href={SOCIALS.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover-lift" aria-label="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover-lift" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" /><span>{edition?.venue_address ?? "Sector 22, Dwarka, New Delhi, 110077"}</span></li>
                <li>
                  <Button variant="hero" size="sm" onClick={() => setContactsOpen(true)}>
                    <Phone className="w-4 h-4" /> Contact Us
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {edition?.name?.split(" ")[0] ?? "PRUMUN"} Secretariat. All rights reserved.</span>
            <span>Crafted with diplomacy in New Delhi.</span>
          </div>
        </div>
      </footer>

      {contactsOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setContactsOpen(false)}
        >
          <div
            className="glass-strong rounded-3xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold gradient-text-deep">Get in touch</h3>
              <button onClick={() => setContactsOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No contacts published yet. Please reach us at the venue.
              </p>
            ) : (
              <ul className="space-y-2">
                {contacts.map(c => (
                  <li key={c.id} className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{c.name}</div>
                        {c.role && <div className="text-xs text-muted-foreground truncate">{c.role}</div>}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </a>
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition">
                          <Mail className="w-3 h-3" /> {c.email}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};
