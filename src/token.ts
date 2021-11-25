import { unixTimestamp } from './unixTimestamp';

export class Token {
  private readonly _token: string;
  private readonly _expiresAt: number;

  constructor(token: string, expiresAt: number) {
    this._token = token;
    this._expiresAt = expiresAt;
  }

  get token(): string {
    return this._token;
  }

  get expiresIn() {
    return this._expiresAt - unixTimestamp();
  }

  get expiresAt() {
    return this._expiresAt;
  }

  isExpired() {
    return this.expiresIn < 0;
  }
}
