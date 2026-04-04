import { BASE_URL } from "./constants"

export enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

interface ApiRes<T> {
  data: T;
  success: boolean;
  message: string;
}

/**
 * Generic HTTP request helper
 *
 * @param base    Base API URL (e.g. AUTH)
 * @param path    Endpoint path (e.g. "/login")
 * @param method  HTTP method (GET, POST, etc.)
 * @param body    Optional request body (for POST/PUT)
 * @param headers Optional custom headers
 *
 * @returns Parsed response data of type T
 */
export async function request<T>(path: string, method: Method, query?: Record<string, string>, body?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
  // Build fetch options
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // Only attach body for methods that support it
  if (body && [Method.POST, Method.PUT].includes(method)) {
    options.body = JSON.stringify(body);
  }

  // Perform the HTTP request and get response
  const queryString = query ? `?${new URLSearchParams(query).toString()}` : "";
  const url = `${BASE_URL}/${path}${queryString}`;
  const response: Response = await fetch(url, options);
  const data: ApiRes<T> = await response.json();

  // Handle errors
  if (!data.success || !response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data.data;
}
