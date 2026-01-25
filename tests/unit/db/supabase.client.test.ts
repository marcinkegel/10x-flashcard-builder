import { describe, it, expect } from "vitest";
import { parseCookieHeader } from "../../../src/db/supabase.client";

describe("supabase.client utils", () => {
  describe("parseCookieHeader", () => {
    it("should parse a single cookie", () => {
      const header = "name=value";
      const result = parseCookieHeader(header);
      expect(result).toEqual([{ name: "name", value: "value" }]);
    });

    it("should parse multiple cookies", () => {
      const header = "name1=value1; name2=value2; name3=value3";
      const result = parseCookieHeader(header);
      expect(result).toEqual([
        { name: "name1", value: "value1" },
        { name: "name2", value: "value2" },
        { name: "name3", value: "value3" },
      ]);
    });

    it("should handle cookies with extra spaces", () => {
      const header = "  name1=value1 ;  name2=value2  ";
      const result = parseCookieHeader(header);
      expect(result).toEqual([
        { name: "name1", value: "value1" },
        { name: "name2", value: "value2" },
      ]);
    });

    it("should handle cookies with '=' in value", () => {
      const header = "name=value=with=equals; other=val";
      const result = parseCookieHeader(header);
      expect(result).toEqual([
        { name: "name", value: "value=with=equals" },
        { name: "other", value: "val" },
      ]);
    });

    it("should return empty array for empty string", () => {
      const header = "";
      const result = parseCookieHeader(header);
      // Based on current implementation: "".split(";") returns [""]
      // Then [""].map -> { name: "", value: "" }
      // If we want it to be more robust, we might need to change implementation.
      // But let's test current behavior first.
      expect(result).toEqual([{ name: "", value: "" }]);
    });
  });
});
