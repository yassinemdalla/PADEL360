import playerLena from "@/assets/player-lena.jpg";
import player1 from "@/assets/player-1.jpg";
import player2 from "@/assets/player-2.jpg";
import player3 from "@/assets/player-3.jpg";

export const profile = {
  name: "Lena Moreau",
  initials: "LM",
  photo: playerLena,
  level: 3.4,
  nextLevel: 4.0,
  points: 847,
  matches: 61,
  wins: 18,
  serveRatio: "3:1",
  streak: "7d",
  progress: 72,
};

export type MatchResult = "WIN" | "LOSS" | "DRAW";

export type Match = {
  id: string;
  date: string;
  opponent: string;
  score: string;
  result: MatchResult;
  club: string;
  delta: string;
};

export const matches: Match[] = [
  { id: "m1", date: "MAR 12", opponent: "vs Costa", score: "6-4", result: "WIN", club: "Riverside · Court 2", delta: "+0.1" },
  { id: "m2", date: "MAR 08", opponent: "vs Ricci", score: "2-4", result: "LOSS", club: "Aramán · Court 1", delta: "-0.2" },
  { id: "m3", date: "MAR 03", opponent: "vs Adeyemi", score: "6-3", result: "WIN", club: "Riverside · Court 4", delta: "+0.1" },
  { id: "m4", date: "FEB 26", opponent: "vs Duarte", score: "4-4", result: "DRAW", club: "Northgate · Court 3", delta: "0.0" },
  { id: "m5", date: "FEB 21", opponent: "vs Bianchi", score: "6-5", result: "WIN", club: "Riverside · Court 2", delta: "+0.2" },
  { id: "m6", date: "FEB 14", opponent: "vs Salas", score: "3-6", result: "LOSS", club: "Aramán · Court 5", delta: "-0.1" },
  { id: "m7", date: "FEB 09", opponent: "vs Kade", score: "6-2", result: "WIN", club: "Northgate · Court 1", delta: "+0.2" },
];

export type Player = {
  id: string;
  name: string;
  photo: string;
  level: number;
  distance: string;
  rating: number;
  style: string;
};

export const players: Player[] = [
  { id: "p1", name: "Marco Costa", photo: player1, level: 3.2, distance: "2.1 km", rating: 4.9, style: "Attack" },
  { id: "p2", name: "Sofia Ricci", photo: player2, level: 3.5, distance: "3.4 km", rating: 4.7, style: "Counter" },
  { id: "p3", name: "Kofi Adeyemi", photo: player3, level: 3.1, distance: "1.8 km", rating: 4.8, style: "Baseline" },
  { id: "p4", name: "Ines Duarte", photo: player1, level: 3.4, distance: "4.0 km", rating: 4.6, style: "Volley" },
  { id: "p5", name: "Tomás Núñez", photo: player2, level: 3.6, distance: "0.8 km", rating: 4.9, style: "Attack" },
  { id: "p6", name: "Nia Bianchi", photo: player3, level: 3.3, distance: "2.6 km", rating: 4.5, style: "Defense" },
];

export type Club = {
  id: string;
  name: string;
  distance: string;
  courts: number;
  price: string;
  slots: { time: string; state: "free" | "taken" }[];
};

export const clubs: Club[] = [
  {
    id: "c1",
    name: "Riverside Padel Club",
    distance: "1.2 km",
    courts: 4,
    price: "€32 / h",
    slots: [
      { time: "08:00", state: "free" },
      { time: "09:00", state: "taken" },
      { time: "10:00", state: "free" },
      { time: "11:00", state: "free" },
      { time: "12:00", state: "taken" },
      { time: "13:00", state: "free" },
      { time: "14:00", state: "free" },
      { time: "15:00", state: "taken" },
      { time: "16:00", state: "free" },
      { time: "17:00", state: "free" },
      { time: "18:00", state: "free" },
      { time: "19:00", state: "taken" },
    ],
  },
  {
    id: "c2",
    name: "Aramán Indoor",
    distance: "3.5 km",
    courts: 6,
    price: "€28 / h",
    slots: [
      { time: "08:00", state: "taken" },
      { time: "09:00", state: "free" },
      { time: "10:00", state: "free" },
      { time: "11:00", state: "taken" },
      { time: "12:00", state: "free" },
      { time: "13:00", state: "free" },
      { time: "14:00", state: "taken" },
      { time: "15:00", state: "free" },
      { time: "16:00", state: "free" },
      { time: "17:00", state: "taken" },
      { time: "18:00", state: "free" },
      { time: "19:00", state: "free" },
    ],
  },
  {
    id: "c3",
    name: "Northgate Courts",
    distance: "5.1 km",
    courts: 3,
    price: "€24 / h",
    slots: [
      { time: "08:00", state: "free" },
      { time: "09:00", state: "free" },
      { time: "10:00", state: "taken" },
      { time: "11:00", state: "free" },
      { time: "12:00", state: "free" },
      { time: "13:00", state: "taken" },
      { time: "14:00", state: "free" },
      { time: "15:00", state: "free" },
      { time: "16:00", state: "taken" },
      { time: "17:00", state: "free" },
      { time: "18:00", state: "taken" },
      { time: "19:00", state: "free" },
    ],
  },
];

export type SlotState = "booked" | "hold" | "available";

export type ScheduleRow = {
  time: string;
  courts: { label: string; state: SlotState }[];
};

export const managerSchedule: ScheduleRow[] = [
  { time: "09:00–10:00", courts: [{ label: "Costa", state: "booked" }, { label: "Open", state: "available" }, { label: "Ricci", state: "booked" }] },
  { time: "10:00–11:00", courts: [{ label: "Ricci", state: "booked" }, { label: "Duarte", state: "booked" }, { label: "Open", state: "available" }] },
  { time: "11:00–12:00", courts: [{ label: "Maintenance", state: "hold" }, { label: "Open", state: "available" }, { label: "Bianchi", state: "booked" }] },
  { time: "12:00–13:00", courts: [{ label: "Open", state: "available" }, { label: "Adeyemi", state: "booked" }, { label: "Open", state: "available" }] },
  { time: "13:00–14:00", courts: [{ label: "Salas", state: "booked" }, { label: "Open", state: "available" }, { label: "Hold", state: "hold" }] },
  { time: "14:00–15:00", courts: [{ label: "Núñez", state: "booked" }, { label: "Kade", state: "booked" }, { label: "Open", state: "available" }] },
];

export const managerBookings = [
  { id: "b1", time: "09:00", court: "Court 1", player: "Marco Costa", status: "Paid", price: "€32" },
  { id: "b2", time: "10:00", court: "Court 1", player: "Sofia Ricci", status: "Paid", price: "€32" },
  { id: "b3", time: "10:00", court: "Court 2", player: "Ines Duarte", status: "Pending", price: "€32" },
  { id: "b4", time: "12:00", court: "Court 2", player: "Kofi Adeyemi", status: "Paid", price: "€32" },
  { id: "b5", time: "14:00", court: "Court 1", player: "Tomás Núñez", status: "Paid", price: "€32" },
];
