import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Quote } from "../types/quote";

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    console.log("Attempting to fetch quotes...");
    setLoading(true);
    setError(null);
    try {
      console.log("Executing Supabase query for quotes...");
      const { data, error: fetchError } = await supabase
        .from("quotes")
        .select(
          "id, name, email, service_type, price, status, created_at, expires_at, staff_id"
        )
        .order("created_at", { ascending: false });

      console.log("Supabase query finished. Error:", fetchError, "Data:", data);

      if (fetchError) {
        console.error("Supabase fetch error object:", fetchError);
        throw fetchError;
      }
      setQuotes(data || []);
      console.log(`Successfully fetched ${data?.length || 0} quotes.`);
    } catch (err: any) {
      console.error("Caught error during fetchQuotes:", err);
      setError(err.details || err.message || "Failed to fetch quotes.");
    } finally {
      console.log(
        "Executing finally block for fetchQuotes, setting loading to false."
      );
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
