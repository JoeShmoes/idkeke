const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!envClientId) {
  console.warn(
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Calendar sync will not work correctly until you configure your own Google OAuth Client ID.',
  );
}

export const GOOGLE_CLIENT_ID = envClientId || '';
export const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
export const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient: any;

export const loadGoogleApi = (callback: (gapi: any) => void) => {
  let gapiLoaded = false;
  let gisLoaded = false;

  const checkLoaded = () => {
    if (gapiLoaded && gisLoaded) {
      callback((window as any).gapi);
    }
  };

  // Load GAPI
  if ((window as any).gapi) {
    gapiLoaded = true;
  } else {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi.load('client', () => {
        gapiLoaded = true;
        checkLoaded();
      });
    };
    script.onerror = (e) => console.error('Failed to load GAPI', e);
    document.body.appendChild(script);
  }

  // Load GIS
  if ((window as any).google) {
    gisLoaded = true;
  } else {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      gisLoaded = true;
      checkLoaded();
    };
    script.onerror = (e) => console.error('Failed to load GIS', e);
    document.body.appendChild(script);
  }
  
  // Check immediately in case both are already present
  checkLoaded();
};

export const initGoogleClient = async (gapi: any) => {
  await gapi.client.init({
    discoveryDocs: DISCOVERY_DOCS,
  });
};

export const signInToGoogle = async (gapi: any, options: { prompt?: string } = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (!GOOGLE_CLIENT_ID) {
        reject(
          new Error(
            'Google client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.',
          ),
        );
        return;
      }

      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp: any) => {
          if (resp.error) {
            reject(resp);
            return;
          }
          // Set the token for gapi calls
          if (gapi.client.setToken) {
            gapi.client.setToken(resp);
          } else {
             // Fallback if setToken isn't available directly on client (should be there)
             // Some versions put it on global gapi.client
             (window as any).gapi.client.setToken(resp);
          }
          resolve(resp);
        },
      });

      // Request token
      // Default to 'consent' to preserve existing behavior, but allow override (e.g. '' for re-auth)
      const promptValue = options.prompt !== undefined ? options.prompt : 'consent';
      tokenClient.requestAccessToken({ prompt: promptValue });
    } catch (err) {
      reject(err);
    }
  });
};

export const listUpcomingEvents = async (gapi: any) => {
  // Fetch events from 1 year ago to 1 year in future
  const timeMin = new Date();
  timeMin.setFullYear(timeMin.getFullYear() - 1);
  
  const response = await gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': timeMin.toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 2500,
    'orderBy': 'startTime'
  });
  return response.result.items;
};

export const createGoogleEvent = async (gapi: any, event: any) => {
  if (!gapi || !gapi.client || !gapi.client.calendar) {
    throw new Error('Google Calendar API not initialized');
  }

  const resource: any = {
    summary: event.title,
    description: event.description,
  };

  if (event.all_day) {
    // For all-day events, Google expects 'date' (YYYY-MM-DD)
    // We assume event.start_date is an ISO string or Date object
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start);
    // Google all-day end date is exclusive, so we might need to add a day if it's single day?
    // Usually existing logic handles this, but let's be safe. 
    // If start == end, add 1 day for Google.
    if (start.getTime() === end.getTime()) {
      end.setDate(end.getDate() + 1);
    }
    
    resource.start = { date: start.toISOString().split('T')[0] };
    resource.end = { date: end.toISOString().split('T')[0] };
  } else {
    resource.start = { dateTime: new Date(event.start_date).toISOString() };
    resource.end = { 
      dateTime: event.end_date 
        ? new Date(event.end_date).toISOString() 
        : new Date(new Date(event.start_date).getTime() + 3600000).toISOString() 
    };
  }

  // Basic recurrence support if available in event object and not expanded
  if (event.recurrence && event.recurrence.enabled !== false) {
     // TODO: Convert internal recurrence to RRULE
     // For now, we sync single instances or handle recurrence later
  }

  try {
    const response = await gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': resource,
    });
    return response.result;
  } catch (error: any) {
    console.error('Error creating Google event:', error);
    // Try to extract a useful message
    const msg = error?.result?.error?.message || error?.message || JSON.stringify(error);
    throw new Error(`Google API Error: ${msg}`);
  }
};

export const updateGoogleEvent = async (gapi: any, eventId: string, event: any) => {
  const resource: any = {
    summary: event.title,
    description: event.description,
  };

  if (event.all_day) {
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start);
    if (start.getTime() === end.getTime()) {
      end.setDate(end.getDate() + 1);
    }
    resource.start = { date: start.toISOString().split('T')[0] };
    resource.end = { date: end.toISOString().split('T')[0] };
  } else {
    resource.start = { dateTime: new Date(event.start_date).toISOString() };
    resource.end = { 
      dateTime: event.end_date 
        ? new Date(event.end_date).toISOString() 
        : new Date(new Date(event.start_date).getTime() + 3600000).toISOString() 
    };
  }

  const response = await gapi.client.calendar.events.patch({
    'calendarId': 'primary',
    'eventId': eventId,
    'resource': resource,
  });
  return response.result;
};

export const deleteGoogleEvent = async (gapi: any, eventId: string) => {
  await gapi.client.calendar.events.delete({
    'calendarId': 'primary',
    'eventId': eventId,
  });
};
