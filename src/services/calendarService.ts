export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

/**
 * Fetches Google Calendar events for the active day or range
 * @param accessToken The Google OAuth access token obtained from signInWithPopup
 * @param dateStr Date in YYYY-MM-DD format
 */
export async function fetchGoogleCalendarEvents(accessToken: string, dateStr: string): Promise<GoogleCalendarEvent[]> {
  try {
    // Construct range for the day (from 00:00:00 to 23:59:59 local/UTC)
    const startOfDay = new Date(`${dateStr}T00:00:00`).toISOString();
    const endOfDay = new Date(`${dateStr}T23:59:59`).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Calendar API Unauthorized. OAuth token might be expired.");
      }
      throw new Error(`Calendar fetch failed: ${res.status}`);
    }

    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

/**
 * Creates a calendar event on Google Calendar
 * @param accessToken Google OAuth Access Token
 * @param eventData Summary, startTime, endTime, and description
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: { title: string; startTimeISO: string; endTimeISO: string; description?: string }
): Promise<any> {
  try {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description || 'Created via Deadline Hero AI',
        start: {
          dateTime: eventData.startTimeISO,
        },
        end: {
          dateTime: eventData.endTimeISO,
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to create calendar event: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}
