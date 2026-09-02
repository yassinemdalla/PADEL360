DELETE FROM public.court_blocks WHERE court_id IN (SELECT id FROM public.courts WHERE club_id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'));
DELETE FROM public.bookings WHERE court_id IN (SELECT id FROM public.courts WHERE club_id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'));
DELETE FROM public.courts WHERE club_id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
DELETE FROM public.clubs WHERE id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');

INSERT INTO public.clubs (id, name, location_label, price_cents, description, photo_url, address, latitude, longitude) VALUES
('a1000000-0000-4000-8000-000000000001','Sahloul Padel Club','Sahloul, Sousse',4000,'Four glass courts under floodlights in the heart of Sahloul, with a shaded terrace and racket rental at the desk.','https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=70','Rue Yasser Arafat, Sahloul, Sousse 4054','35.8342','10.5931'),
('a1000000-0000-4000-8000-000000000002','Port El Kantaoui Padel','Port El Kantaoui',4500,'Seafront courts beside the marina — two panoramic outdoor courts and one covered court for the summer heat.','https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=70','Zone Touristique, Port El Kantaoui, Sousse 4089','35.8917','10.5950'),
('a1000000-0000-4000-8000-000000000003','Khezama Padel Center','Khezama, Sousse',3800,'Indoor climate-controlled padel hall with three courts, coaching clinics every weekday evening.','https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=70','Avenue Taieb Mhiri, Khezama Est, Sousse 4051','35.8551','10.6002'),
('a1000000-0000-4000-8000-000000000004','Hammam Sousse Padel Arena','Hammam Sousse',3500,'Community club with two artificial-grass courts, floodlit until midnight and popular for weekend americanas.','https://images.unsplash.com/photo-1613918431703-aa50889e3be9?auto=format&fit=crop&w=1200&q=70','Route de Kalaa Kebira, Hammam Sousse 4011','35.8611','10.5947'),
('a1000000-0000-4000-8000-000000000005','Sousse Medina Padel','Sousse Centre',3200,'Two rooftop courts a short walk from the medina, with sea views and a small clubhouse cafe.','https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=70','Avenue Habib Bourguiba, Sousse 4000','35.8256','10.6369');

INSERT INTO public.courts (club_id, name, position, description, surface) VALUES
('a1000000-0000-4000-8000-000000000001','Court 1 — Centre',1,'Main show court with stadium lighting and spectator seating.','Glass'),
('a1000000-0000-4000-8000-000000000001','Court 2 — Olive',2,'Outdoor glass court, shaded from late afternoon.','Glass'),
('a1000000-0000-4000-8000-000000000001','Court 3 — Terrace',3,'Next to the terrace, great for casual doubles.','Glass'),
('a1000000-0000-4000-8000-000000000001','Court 4 — Academy',4,'Reserved for clinics most weekday mornings.','Mesh'),
('a1000000-0000-4000-8000-000000000002','Marina Court',1,'Panoramic court facing the marina.','Panoramic glass'),
('a1000000-0000-4000-8000-000000000002','Sunset Court',2,'Open-air court, best light after 17:00.','Glass'),
('a1000000-0000-4000-8000-000000000002','Covered Court',3,'Roofed court, playable through summer midday.','Glass'),
('a1000000-0000-4000-8000-000000000003','Hall A',1,'Indoor court with air conditioning and LED lighting.','Glass'),
('a1000000-0000-4000-8000-000000000003','Hall B',2,'Indoor court used for the club league.','Glass'),
('a1000000-0000-4000-8000-000000000003','Hall C',3,'Indoor coaching court with ball machine.','Mesh'),
('a1000000-0000-4000-8000-000000000004','Arena 1',1,'Artificial grass, floodlit until midnight.','Artificial grass'),
('a1000000-0000-4000-8000-000000000004','Arena 2',2,'Artificial grass, hosts weekend americanas.','Artificial grass'),
('a1000000-0000-4000-8000-000000000005','Rooftop North',1,'Rooftop court with sea views.','Glass'),
('a1000000-0000-4000-8000-000000000005','Rooftop South',2,'Rooftop court beside the clubhouse cafe.','Glass');