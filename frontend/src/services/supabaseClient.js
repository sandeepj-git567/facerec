import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://fsqimethnzloxmxkwfse.supabase.co';
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_HBxr2NEOtdWhPLCyi5wYOA_kr94_flY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Subscribe to real-time attendance changes (INSERT / UPDATE)
 */
export const subscribeToAttendance = (onPayload) => {
  const channel = supabase
    .channel('realtime:attendance')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        if (onPayload) onPayload(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to real-time helpdesk queries (INSERT / UPDATE)
 */
export const subscribeToQueries = (onPayload) => {
  const channel = supabase
    .channel('realtime:helpdesk_queries')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'helpdesk_queries' },
      (payload) => {
        if (onPayload) onPayload(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to real-time security audit events
 */
export const subscribeToSecurityLogs = (onPayload) => {
  const channel = supabase
    .channel('realtime:security_audit_logs')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'security_audit_logs' },
      (payload) => {
        if (onPayload) onPayload(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export default supabase;
