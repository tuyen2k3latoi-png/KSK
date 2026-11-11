import { buildGoogleCalendarEventPayload } from '../utils/healthCalculations';

export interface GoogleCalendarHealthEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  startDateTime: string;
  endDateTime: string;
}

const CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export async function listUpcomingHealthEvents(
  accessToken: string,
  maxResults = 10
): Promise<GoogleCalendarHealthEvent[]> {
  const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${CALENDAR_BASE_URL}?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Không thể tải lịch Google Calendar (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((item: any) => ({
    id: String(item.id),
    summary: String(item.summary || '(Sự kiện không tiêu đề)'),
    description: item.description ? String(item.description) : undefined,
    location: item.location ? String(item.location) : undefined,
    htmlLink: item.htmlLink ? String(item.htmlLink) : undefined,
    startDateTime: String(item.start?.dateTime || item.start?.date || ''),
    endDateTime: String(item.end?.dateTime || item.end?.date || ''),
  }));
}

export async function createCalendarHealthEvent(
  accessToken: string,
  params: {
    summary: string;
    description: string;
    location: string;
    date: string;
    time: string;
    durationMinutes: number;
  }
): Promise<GoogleCalendarHealthEvent> {
  const body = buildGoogleCalendarEventPayload(params);
  const res = await fetch(CALENDAR_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Không thể tạo lịch hẹn trên Google Calendar (${res.status}): ${errBody}`);
  }

  const item = await res.json();
  return {
    id: String(item.id),
    summary: String(item.summary || params.summary),
    description: item.description ? String(item.description) : undefined,
    location: item.location ? String(item.location) : undefined,
    htmlLink: item.htmlLink ? String(item.htmlLink) : undefined,
    startDateTime: String(item.start?.dateTime || item.start?.date || ''),
    endDateTime: String(item.end?.dateTime || item.end?.date || ''),
  };
}

export async function deleteCalendarHealthEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const res = await fetch(`${CALENDAR_BASE_URL}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errBody = await res.text();
    throw new Error(`Không thể xóa lịch hẹn (${res.status}): ${errBody}`);
  }
}
