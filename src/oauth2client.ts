export interface OAuth2Client {
  getAccessToken(): Promise<string>;
}
