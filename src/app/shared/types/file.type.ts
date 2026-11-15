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
  type: 'movie';
}
