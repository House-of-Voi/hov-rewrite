import {
  mockProfile,
  mockAccounts,
  mockReferrals,
  mockAttributions,
  mockSessions,
} from './mockData';

type Row = Record<string, unknown>;

interface SupabaseResult<T> {
  data: T;
  error: null;
}

const tableData: Record<string, Row[]> = {
  profiles: [mockProfile as Row],
  accounts: mockAccounts as Row[],
  referrals: mockReferrals as Row[],
  referral_attributions: mockAttributions as Row[],
  sessions: mockSessions as Row[],
  nonces: [],
};

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function filterRows(data: Row[], column: string, value: unknown): Row[] {
  return data.filter((row) => row[column] === value);
}

// Mock Supabase client that returns demo data
export function createMockSupabaseClient() {
  return {
    from: (table: string) => {
      const data = tableData[table] ?? [];

      return {
        select: (_columns?: string) => {
          void _columns;

          return {
            eq: (column: string, value: unknown) =>
              Promise.resolve<SupabaseResult<Row[]>>({
                data: filterRows(data, column, value),
                error: null,
              }),
            single: () =>
              Promise.resolve<SupabaseResult<Row | null>>({
                data: data[0] ?? null,
                error: null,
              }),
            then: <Return>(resolve: (result: SupabaseResult<Row[]>) => Return) =>
              resolve({ data, error: null }),
          };
        },
        insert: (values: Row | Row[]) => ({
          select: () => ({
            single: () => {
              const [newRecord] = toArray(values);
              console.log(`[DEMO] Mock insert into ${table}:`, values);
              return Promise.resolve<SupabaseResult<Row>>({
                data: { id: `mock-${Date.now()}`, ...(newRecord ?? {}) },
                error: null,
              });
            },
            then: <Return>(resolve: (result: SupabaseResult<Row[]>) => Return) => {
              const records = toArray(values).map((record) => ({
                id: `mock-${Date.now()}`,
                ...(record ?? {}),
              }));
              console.log(`[DEMO] Mock insert into ${table}:`, values);
              return resolve({ data: records, error: null });
            },
          }),
          then: <Return>(resolve: (result: SupabaseResult<null>) => Return) => {
            console.log(`[DEMO] Mock insert into ${table}:`, values);
            return resolve({ data: null, error: null });
          },
        }),
        update: (values: Row) => ({
          eq: (column: string, value: unknown) => {
            console.log(
              `[DEMO] Mock update ${table} where ${column}=${String(value)}:`,
              values
            );
            return Promise.resolve<SupabaseResult<null>>({
              data: null,
              error: null,
            });
          },
          then: <Return>(resolve: (result: SupabaseResult<null>) => Return) => {
            console.log(`[DEMO] Mock update ${table}:`, values);
            return resolve({ data: null, error: null });
          },
        }),
        delete: () => ({
          eq: (column: string, value: unknown) => {
            console.log(
              `[DEMO] Mock delete from ${table} where ${column}=${String(value)}`
            );
            return Promise.resolve<SupabaseResult<null>>({
              data: null,
              error: null,
            });
          },
          then: <Return>(resolve: (result: SupabaseResult<null>) => Return) => {
            console.log(`[DEMO] Mock delete from ${table}`);
            return resolve({ data: null, error: null });
          },
        }),
        upsert: (values: Row | Row[]) => ({
          select: () => ({
            single: () => {
              const [newRecord] = toArray(values);
              console.log(`[DEMO] Mock upsert into ${table}:`, values);
              return Promise.resolve<SupabaseResult<Row>>({
                data: { id: `mock-${Date.now()}`, ...(newRecord ?? {}) },
                error: null,
              });
            },
          }),
          then: <Return>(resolve: (result: SupabaseResult<null>) => Return) => {
            console.log(`[DEMO] Mock upsert into ${table}:`, values);
            return resolve({ data: null, error: null });
          },
        }),
      };
    },
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: null },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}
