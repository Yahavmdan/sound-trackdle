export type File = {
  id: number;
  token?: string;
  name: string;
  label?: string;
  year: number;
  file_path?: string;
  main_actor?: string;
  played_at?: string;
  clicked?: boolean;
  genre?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  poster_url?: string | null;
  imdb_url?: string | null;
  type: 'movie';
}
