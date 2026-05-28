// URL du backend PARALLAX.
// En développement : laisser tel quel (localhost:5000).
// En production : créer un fichier .env avec VITE_API_URL=http://<ip-nœud-maître>:5000
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
