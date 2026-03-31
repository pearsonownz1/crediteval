import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Quote } from "../types/quote";

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("quotes")
        .select(
          "id, name, email, service_type, services, price, status, created_at, expires_at, staff_id"
        )
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      setQuotes(data || []);
    } catch (err: any) {
      console.error("Error fetching quotes:", err);
      setError(err.details || err.message || "Failed to fetch quotes.");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuotes = async (ids: string[]) => {
    if (ids.length === 0)
      return { success: false, message: "No quotes selected" };

    try {
      const { error: deleteError } = await supabase
        .from("quotes")
        .delete()
        .in("id", ids);

      if (deleteError) throw deleteError;
      await fetchQuotes();
      return { success: true, message: `${ids.length} quote(s) deleted.` };
    } catch (err: any) {
      const errorMessage =
        err.details || err.message || "Failed to delete quotes.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
    deleteQuotes,
  };
};
