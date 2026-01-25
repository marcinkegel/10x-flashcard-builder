import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Mock astro:middleware BEFORE importing the middleware
vi.mock("astro:middleware", () => ({
  defineMiddleware: vi.fn((handler) => handler),
}));

import { onRequest } from "../../src/middleware/index";
import { createSupabaseServerInstance } from "../../src/db/supabase.client";

// Mock the Supabase client creation
vi.mock("../../src/db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("Middleware", () => {
  let mockSupabase: {
    auth: {
      getUser: Mock;
    };
  };
  let mockNext: Mock;
  let mockRedirect: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    };
    (createSupabaseServerInstance as Mock).mockReturnValue(mockSupabase);

    mockNext = vi.fn().mockResolvedValue(new Response("next"));
    mockRedirect = vi
      .fn()
      .mockImplementation((path: string) => new Response(null, { status: 302, headers: { Location: path } }));
  });

  const createMockContext = (pathname: string, user: { id: string; email?: string } | null = null) => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });

    return {
      locals: {} as Record<string, unknown>,
      cookies: {
        set: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
      } as unknown,
      url: new URL(`http://localhost${pathname}`),
      request: { headers: new Headers() } as unknown as Request,
      redirect: mockRedirect,
    };
  };

  it("should redirect unauthenticated user from /generate to /login", async () => {
    const context = createMockContext("/generate");
    const response = await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining("/login"));
    expect(response.status).toBe(302);
  });

  it("should allow authenticated user to access /generate", async () => {
    const context = createMockContext("/generate", { id: "user-123", email: "test@example.com" });
    const typedContext = context as { locals: { user: { id: string; email: string } } };
    await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(typedContext.locals.user).toEqual({
      id: "user-123",
      email: "test@example.com",
    });
  });

  it("should redirect authenticated user from /login to /generate", async () => {
    const context = createMockContext("/login", { id: "user-123" });
    const response = await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(mockRedirect).toHaveBeenCalledWith("/generate");
    expect(response.status).toBe(302);
  });

  it("should return 401 for unauthenticated API requests", async () => {
    const context = createMockContext("/api/flashcards");
    const response = await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should redirect to /generate from root if authenticated", async () => {
    const context = createMockContext("/", { id: "user-123" });
    await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(mockRedirect).toHaveBeenCalledWith("/generate");
  });

  it("should redirect to /login from root if unauthenticated", async () => {
    const context = createMockContext("/");
    await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  it("should allow access to public paths without authentication", async () => {
    const context = createMockContext("/login");
    await onRequest(context as Parameters<typeof onRequest>[0], mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
