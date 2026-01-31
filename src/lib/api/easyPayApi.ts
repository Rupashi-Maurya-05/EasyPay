import { supabase } from "@/integrations/supabase/client";

export interface ExplainSmsResponse {
  success?: boolean;
  explanation?: string;
  originalText?: string;
  error?: string;
}

export interface ProcessOcrResponse {
  success?: boolean;
  extractedText?: string;
  error?: string;
}

export interface LogTransactionResponse {
  success?: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

export const easyPayApi = {
  /**
   * Explain an SMS message in simple language using AI
   */
  async explainSms(smsText: string, language: string = "en-US"): Promise<ExplainSmsResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("explain-sms", {
        body: { smsText, language },
      });

      if (error) {
        console.error("explain-sms error:", error);
        return { error: error.message || "Failed to explain message" };
      }

      return data;
    } catch (err) {
      console.error("Network error:", err);
      return { error: "Network error. Please check your connection." };
    }
  },

  /**
   * Process an image with OCR using AI vision
   */
  async processOcr(imageBase64: string, language: string = "en-US"): Promise<ProcessOcrResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("process-ocr", {
        body: { imageBase64, language },
      });

      if (error) {
        console.error("process-ocr error:", error);
        return { error: error.message || "Failed to process image" };
      }

      return data;
    } catch (err) {
      console.error("Network error:", err);
      return { error: "Network error. Please check your connection." };
    }
  },

  /**
   * Log a payment transaction
   */
  async logTransaction(
    upiId: string,
    amount: number,
    recipientName?: string,
    upiLink?: string
  ): Promise<LogTransactionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("log-transaction", {
        body: { upiId, amount, recipientName, upiLink },
      });

      if (error) {
        console.error("log-transaction error:", error);
        return { error: error.message || "Failed to log transaction" };
      }

      return data;
    } catch (err) {
      console.error("Network error:", err);
      return { error: "Network error. Please check your connection." };
    }
  },
};
