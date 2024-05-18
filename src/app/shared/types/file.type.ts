export type File = {
  id: number;
  name: string;
  year: number;
  file_path?: string;
  is_recently_played: number;
  type: 'movie';
}
