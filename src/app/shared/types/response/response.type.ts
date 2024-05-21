export type AuthenticationResponse = {
  code: number;
  message: string;
  token: string;
}

export type ErrorResponse = {
  code: number;
  exception?: string;
  message: string;
}

export type OkResponse = {
  code: number;
  message: string;
}
