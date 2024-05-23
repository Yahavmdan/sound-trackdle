export type File = {
  id: number;
  name: string;
  year: number;
  file_path?: string;
  main_actor?: string;
  played_at?: string;
  genre?: string;
  type: 'movie';
}
