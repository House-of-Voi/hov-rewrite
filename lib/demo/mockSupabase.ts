import {
  mockProfile,
  mockAccounts,
  mockReferrals,
  mockAttributions,
  mockSessions
} from './mockData';

// Mock Supabase client that returns demo data
export function createMockSupabaseClient() {
  return {
    from: (table: string) => {
      const tables: Record<string, any[]> = {
        profiles: [mockProfile],
        accounts: mockAccounts,
        referrals: mockReferrals,
        referral_attributions: mockAttributions,
        sessions: mockSessions,
        nonces: [],
      };

      const data = tables[table] || [];

      return {
        select: (columns?: string) => ({
          eq: (column: string, value: any) => {
            const filtered = data.filter((row: any) => row[column] === value);
            return Promise.resolve({ data: filtered, error: null });
          },
          single: () => {
            return Promise.resolve({ data: data[0] || null, error: null });
          },
          then: (resolve: any) => resolve({ data, error: null }),
        }),
        insert: (values: any) => ({
          select: () => ({
            single: () => {
              console.log(`[DEMO] Mock insert into ${table}:`, values);
              const newRecord = Array.isArray(values) ? values[0] : values;
              return Promise.resolve({
                data: { id: 'mock-' + Date.now(), ...newRecord },
                error: null
              });
            },
            then: (resolve: any) => {
              console.log(`[DEMO] Mock insert into ${table}:`, values);
              const records = Array.isArray(values) ? values : [values];
              return resolve({
                data: records.map((r: any) => ({ id: 'mock-' + Date.now(), ...r })),
                error: null
              });
            },
          }),
          then: (resolve: any) => {
            console.log(`[DEMO] Mock insert into ${table}:`, values);
            return resolve({ data: null, error: null });
          },
        }),
        update: (values: any) => ({
          eq: (column: string, value: any) => {
            console.log(`[DEMO] Mock update ${table} where ${column}=${value}:`, values);
            return Promise.resolve({ data: null, error: null });
          },
          then: (resolve: any) => {
            console.log(`[DEMO] Mock update ${table}:`, values);
            return resolve({ data: null, error: null });
          },
        }),
        delete: () => ({
          eq: (column: string, value: any) => {
            console.log(`[DEMO] Mock delete from ${table} where ${column}=${value}`);
            return Promise.resolve({ data: null, error: null });
          },
          then: (resolve: any) => {
            console.log(`[DEMO] Mock delete from ${table}`);
            return resolve({ data: null, error: null });
          },
        }),
        upsert: (values: any) => ({
          select: () => ({
            single: () => {
              console.log(`[DEMO] Mock upsert into ${table}:`, values);
              const newRecord = Array.isArray(values) ? values[0] : values;
              return Promise.resolve({
                data: { id: 'mock-' + Date.now(), ...newRecord },
                error: null
              });
            },
          }),
          then: (resolve: any) => {
            console.log(`[DEMO] Mock upsert into ${table}:`, values);
            return resolve({ data: null, error: null });
          },
        }),
      };
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}
