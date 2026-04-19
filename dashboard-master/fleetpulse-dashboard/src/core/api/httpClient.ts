import { appConstants } from '../../config/appConstants';
import { withApiBase } from '../../config/runtime';
import type { AppError } from '../../shared/types/common';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;

  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;

  const date = new Date(header).getTime();
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
}

export async function httpFetch<T>(
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const response = await fetch(withApiBase(path), {
    ...options,
    headers: mergedHeaders,
  });

  if (response.status === 503) {
    const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));

    if (
      retryAfter !== null &&
      retryCount < appConstants.http.maxServiceUnavailableRetries
    ) {
      await sleep(retryAfter);
      return httpFetch<T>(path, options, retryCount + 1);
    }
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    let details: unknown = undefined;

    if (contentType.includes('application/json')) {
      try {
        details = await response.json();
      } catch {
        details = undefined;
      }
    } else {
      try {
        details = await response.text();
      } catch {
        details = undefined;
      }
    }

    throw {
      message: `HTTP ${response.status}`,
      code: response.status,
      details,
    } satisfies AppError;
  }

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw {
      message: `Expected JSON but received: ${contentType || 'unknown content-type'}`,
      details: text.slice(0, 200),
    } satisfies AppError;
  }

  return response.json() as Promise<T>;
}