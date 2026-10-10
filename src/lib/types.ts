export type IncidentStatus = "PENDING" | "PUBLISHED" | "CLOSED" | "HIDDEN";
export type Severity = "BAJA" | "MEDIA" | "ALTA";
export type VoteType = "CONFIRMADO" | "YO_LO_VI" | "IMPORTANTE";

export type IncidentType = {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string | null;
};

/** Fila de la vista pública incident_feed (sin datos del autor). */
export type FeedIncident = {
  id: number;
  incident_type_id: number;
  type_name: string;
  type_icon: string;
  type_color: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  status: IncidentStatus;
  severity: Severity;
  occurred_at: string;
  created_at: string;
  cover_url: string | null;
  votes_count: number;
  comments_count: number;
};

export type Profile = {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
};
