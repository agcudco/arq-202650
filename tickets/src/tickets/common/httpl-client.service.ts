import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  async get<T>(url: string): Promise<T> {
    this.logger.debug(`GET ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      this.logger.error(`GET ${url} failed: ${response.statusText}`);
      throw new Error(`Error fetching ${url}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, body: any): Promise<T> {
    this.logger.debug(`POST ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      this.logger.error(`POST ${url} failed: ${response.statusText}`);
      throw new Error(`POST ${url} failed: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async patch<T>(url: string, body: any): Promise<T> {
    this.logger.debug(`PATCH ${url}`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      this.logger.error(`PATCH ${url} failed: ${response.statusText}`);
      throw new Error(`PATCH ${url} failed: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
