import axios from "axios";
import crypto from "crypto";
import {
  IMonnifyCheckoutRequest,
  IMonnifyCheckoutResponse,
  IMonnifyWebhookPayload,
} from "../order/interface";
import { logger } from "../utils/logger";

// Monnify API configuration
const MONNIFY_BASE_URL =
  process.env.MONNIFY_BASE_URL || "https://api.monnify.com";
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || "";
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || "";
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || "";

class PaymentService {
  /**
   * Validate Monnify configuration
   */
  private validateConfig(): void {
    if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY || !MONNIFY_CONTRACT_CODE) {
      throw new Error(
        "Monnify configuration is incomplete. Please ensure MONNIFY_API_KEY, MONNIFY_SECRET_KEY, and MONNIFY_CONTRACT_CODE are set in your environment variables."
      );
    }
  }

  /**
   * Format Nigerian phone number for Monnify
   * Converts +23409037865253 -> 2349037865253 (removes + and leading 0)
   */
  private formatNigerianPhone(phone: string): string {
    let cleaned = phone.replace(/\s+/g, "").replace("+", "");

    // Handle +2340... format (remove the 0 after country code)
    if (cleaned.startsWith("2340")) {
      cleaned = "234" + cleaned.slice(4);
    }

    // Handle 0... format (add country code and remove leading 0)
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.slice(1);
    }

    // Ensure it starts with 234 (Nigerian country code)
    if (!cleaned.startsWith("234")) {
      cleaned = "234" + cleaned;
    }

    return cleaned;
  }

  /**
   * Generate authentication token for Monnify API
   */
  private async getAuthToken(): Promise<string> {
    this.validateConfig();
    
    try {
      const credentials = Buffer.from(
        `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`
      ).toString("base64");
      const response = await axios.post(
        `${MONNIFY_BASE_URL}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (
        response.data?.requestSuccessful &&
        response.data?.responseBody?.accessToken
      ) {
        logger.info("Monnify auth token obtained successfully");
        return response.data.responseBody.accessToken;
      }

      // Log the response for debugging
      logger.error("Failed to get Monnify auth token - invalid response", undefined, {
        responseData: response.data,
        requestSuccessful: response.data?.requestSuccessful,
        hasAccessToken: !!response.data?.responseBody?.accessToken,
      });
      throw new Error(
        response.data?.responseMessage || "Failed to get Monnify authentication token"
      );
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle 401 specifically
      if (error.response?.status === 401) {
        logger.error("Monnify authentication failed - Invalid credentials", err, {
          status: error.response.status,
          responseData: error.response.data,
          apiKeyPrefix: MONNIFY_API_KEY?.substring(0, 8) + "...", // Log first 8 chars only for security
        });
        throw new Error(
          "Invalid Monnify authentication credentials. Please check that MONNIFY_API_KEY and MONNIFY_SECRET_KEY are correct and match your Monnify account (test or production)."
        );
      }
      
      logger.error("Error getting Monnify auth token", err, {
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      throw new Error(
        error.response?.data?.responseMessage || 
        "Failed to authenticate with Monnify. Please check your credentials and try again."
      );
    }
  }

  /**
   * Create checkout URL with Monnify
   */
  public async createCheckoutUrl(
    request: IMonnifyCheckoutRequest
  ): Promise<IMonnifyCheckoutResponse> {
    try {
      const authToken = await this.getAuthToken();
      
      // Ensure contract code is provided
      const contractCode = request.contractCode || MONNIFY_CONTRACT_CODE;
      if (!contractCode) {
        throw new Error(
          "MONNIFY_CONTRACT_CODE is required. Please set it in your environment variables."
        );
      }

      // Normalize amount to 2 decimal places to avoid discrepancies
      // between what the user sees (e.g. 264.45) and what is sent to Monnify.
      // Monnify accepts decimal amounts, so we round to 2dp instead of flooring.
      const rawAmount =
        typeof request.amount === "string"
          ? parseFloat(request.amount)
          : request.amount;

      const amount = Math.round(rawAmount * 100) / 100;
      
      // Validate required fields
      if (!request.customerName || !request.customerEmail || !request.customerPhoneNumber) {
        throw new Error("Customer name, email, and phone number are required");
      }

      // Format phone number for Monnify (Nigerian format: remove + and leading 0)
      const formattedPhone = this.formatNigerianPhone(request.customerPhoneNumber);

      // Build payload - try without metadata first to see if that's causing the issue
      const payload: any = {
        amount: amount,
        customerName: request.customerName.trim(),
        customerEmail: request.customerEmail.trim(),
        customerPhoneNumber: formattedPhone,
        paymentDescription: request.paymentDescription.trim(),
        currencyCode: request.currencyCode || "NGN",
        contractCode: contractCode,
        redirectUrl: request.redirectUrl,
        paymentReference: request.paymentReference,
        paymentMethods: request.paymentMethods || ["CARD", "USSD", "ACCOUNT_TRANSFER"],
      };
      
      // Only add metadata if provided (some Monnify configurations may not accept it)
      if (request.metadata && Object.keys(request.metadata).length > 0) {
        payload.metaData = request.metadata;
      }
      
      logger.info("Creating Monnify checkout URL", {
        paymentReference: request.paymentReference,
        amount: amount,
        amountType: typeof amount,
        contractCode: contractCode.substring(0, 8) + "...", // Log first 8 chars only
        redirectUrl: request.redirectUrl,
        customerName: request.customerName.substring(0, 20) + "...", // Log first 20 chars
        customerEmail: request.customerEmail,
        originalPhoneNumber: request.customerPhoneNumber?.substring(0, 15), // Log original
        formattedPhoneNumber: formattedPhone?.substring(0, 15), // Log formatted
        paymentMethods: payload.paymentMethods,
      });

      // Log the actual payload being sent (sanitized for security)
      logger.info("Monnify payload being sent", {
        amount: payload.amount,
        customerName: payload.customerName.substring(0, 20) + "...",
        customerEmail: payload.customerEmail,
        customerPhoneNumber: payload.customerPhoneNumber.substring(0, 15),
        paymentDescription: payload.paymentDescription.substring(0, 50) + "...",
        currencyCode: payload.currencyCode,
        contractCode: payload.contractCode.substring(0, 8) + "...",
        redirectUrl: payload.redirectUrl,
        paymentReference: payload.paymentReference,
        paymentMethods: payload.paymentMethods,
        hasMetaData: !!payload.metaData,
      });

      const response = await axios.post(
        `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        }
      );

      if (!response.data?.requestSuccessful) {
        throw new Error(
          response.data?.responseMessage || "Failed to create checkout URL"
        );
      }

      logger.info("Monnify checkout URL created successfully", {
        paymentReference: request.paymentReference,
        transactionReference: response.data?.responseBody?.transactionReference,
      });

      return response.data;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating Monnify checkout URL", err, {
        paymentReference: request.paymentReference,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Handle 400 specifically (bad request - malformed syntax)
      if (error.response?.status === 400) {
        const amount = typeof request.amount === 'string' ? parseFloat(request.amount) : request.amount;
        const contractCode = request.contractCode || MONNIFY_CONTRACT_CODE;
        logger.error("Monnify checkout failed - Bad Request (400)", err, {
          status: error.response.status,
          responseData: error.response.data,
          responseMessage: error.response.data?.responseMessage,
          responseCode: error.response.data?.responseCode,
          paymentReference: request.paymentReference,
          // Log the payload that was sent (sanitized) - rebuild formatted phone for logging
          payloadSent: {
            amount: amount,
            amountType: typeof amount,
            customerName: request.customerName?.substring(0, 30),
            customerEmail: request.customerEmail,
            originalPhoneNumber: request.customerPhoneNumber?.substring(0, 15),
            formattedPhoneNumber: (() => {
              let phone = request.customerPhoneNumber?.trim() || '';
              if (phone.startsWith('+')) phone = phone.substring(1);
              return phone.replace(/[\s\-\(\)\.]/g, '').substring(0, 15);
            })(),
            paymentDescription: request.paymentDescription?.substring(0, 50),
            currencyCode: request.currencyCode || "NGN",
            contractCode: contractCode?.substring(0, 8) + "...",
            redirectUrl: request.redirectUrl,
            paymentReference: request.paymentReference,
            paymentMethods: request.paymentMethods || ["CARD", "USSD", "ACCOUNT_TRANSFER"],
            hasMetaData: !!request.metadata,
          },
        });
        
        const errorMessage = error.response?.data?.responseMessage || 
          "The request could not be completed due to malformed syntax. Please check the request payload.";
        
        throw new Error(errorMessage);
      }

      // Handle 401 specifically (authentication error)
      if (error.response?.status === 401) {
        const contractCode = request.contractCode || MONNIFY_CONTRACT_CODE;
        logger.error("Monnify checkout failed - Authentication error", err, {
          status: error.response.status,
          responseData: error.response.data,
          paymentReference: request.paymentReference,
          contractCodePrefix: contractCode?.substring(0, 8) + "...", // Log first 8 chars only
          redirectUrl: request.redirectUrl, // Log redirect URL to check if localhost is the issue
        });
        
        // Provide more specific error message
        const errorMessage = error.response?.data?.responseMessage || 
          "Invalid authentication credentials. Please check that the right credentials are being used for the right environment.";
        
        // Check if redirect URL contains localhost
        const isLocalhost = request.redirectUrl?.includes('localhost') || request.redirectUrl?.includes('127.0.0.1');
        const localhostNote = isLocalhost 
          ? " Also note: You're using localhost as redirect URL. Some payment gateways may require a public URL. Consider using ngrok for local development."
          : "";
        
        throw new Error(
          `${errorMessage} Note: Your API credentials are valid (auth token obtained), but the contract code may be incorrect or not match your API credentials environment (test vs production).${localhostNote}`
        );
      }

      if (error.response?.data) {
        const errorMessage = error.response.data.responseMessage || "Failed to create checkout URL";
        // Build payload info from request for logging
        const amount = typeof request.amount === 'string' ? parseFloat(request.amount) : request.amount;
        const contractCode = request.contractCode || MONNIFY_CONTRACT_CODE;
        logger.error("Monnify checkout failed", err, {
          status: error.response.status,
          responseData: error.response.data,
          paymentReference: request.paymentReference,
          // Log the payload that was sent (sanitized)
          payloadSent: {
            amount: amount,
            amountType: typeof amount,
            hasCustomerName: !!request.customerName,
            hasCustomerEmail: !!request.customerEmail,
            hasCustomerPhoneNumber: !!request.customerPhoneNumber,
            hasPaymentDescription: !!request.paymentDescription,
            currencyCode: request.currencyCode || "NGN",
            hasContractCode: !!contractCode,
            hasRedirectUrl: !!request.redirectUrl,
            hasPaymentReference: !!request.paymentReference,
            paymentMethods: request.paymentMethods || ["CARD", "USSD", "ACCOUNT_TRANSFER"],
            hasMetaData: !!request.metadata,
          },
        });
        throw new Error(errorMessage);
      }

      throw new Error("Failed to create checkout URL with Monnify");
    }
  }

  /**
   * Verify payment transaction with Monnify
   */
  public async verifyTransaction(
    transactionReference: string
  ): Promise<any> {
    try {
      const authToken = await this.getAuthToken();

      const response = await axios.get(
        `${MONNIFY_BASE_URL}/api/v2/transactions/${encodeURIComponent(
          transactionReference
        )}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (!response.data?.requestSuccessful) {
        throw new Error(
          response.data?.responseMessage || "Failed to verify transaction"
        );
      }

      return response.data.responseBody;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error verifying Monnify transaction", err, {
        transactionReference,
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error.response?.data) {
        throw new Error(
          error.response.data.responseMessage || "Failed to verify transaction"
        );
      }

      throw new Error("Failed to verify transaction with Monnify");
    }
  }

  /**
   * Verify Monnify webhook signature
   */
  public verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    try {
      const computedHash = crypto
        .createHmac("sha512", MONNIFY_SECRET_KEY)
        .update(payload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(computedHash, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch (error: any) {
      logger.error("Error verifying webhook signature", error);
      return false;
    }
  }

  /**
   * Parse and validate webhook payload
   */
  public parseWebhookPayload(body: any): IMonnifyWebhookPayload | null {
    try {
      if (
        !body.eventType ||
        !body.eventData ||
        !body.eventData.transactionReference ||
        !body.eventData.paymentReference
      ) {
        return null;
      }

      return {
        eventType: body.eventType,
        eventData: {
          product: body.eventData.product || {},
          transactionReference: body.eventData.transactionReference,
          paymentReference: body.eventData.paymentReference,
          amountPaid: body.eventData.amountPaid || "0",
          totalPayable: body.eventData.totalPayable || "0",
          settlementAmount: body.eventData.settlementAmount || "0",
          paidOn: body.eventData.paidOn || "",
          paymentStatus: body.eventData.paymentStatus || "",
          paymentDescription: body.eventData.paymentDescription || "",
          currency: body.eventData.currency || "NGN",
          paymentMethod: body.eventData.paymentMethod || "",
          customer: body.eventData.customer || {},
          metaData: body.eventData.metaData || {},
        },
      };
    } catch (error: any) {
      logger.error("Error parsing webhook payload", error);
      return null;
    }
  }
}

export const paymentService = new PaymentService();
