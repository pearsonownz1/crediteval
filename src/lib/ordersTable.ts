const configuredOrdersTable = import.meta.env.VITE_SUPABASE_ORDERS_TABLE;

export const ordersTable =
  typeof configuredOrdersTable === "string" &&
  configuredOrdersTable.trim().length > 0
    ? configuredOrdersTable
    : "orders";
