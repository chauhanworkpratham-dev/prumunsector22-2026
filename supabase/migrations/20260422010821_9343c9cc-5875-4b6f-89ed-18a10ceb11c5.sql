-- Enable realtime broadcasts so the public Matrix and admin views update instantly
ALTER TABLE public.registrations REPLICA IDENTITY FULL;
ALTER TABLE public.committees REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.editions REPLICA IDENTITY FULL;
ALTER TABLE public.schedule_items REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.committees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.editions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_items;