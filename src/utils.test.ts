import { describe, expect, test } from "bun:test";
import { normalizeRoutePath } from "./utils";

describe("normalizeRoutePath", () => {
  test("strips trailing slash from a path", () => {
    expect(normalizeRoutePath("/guide/")).toBe("/guide");
  });

  test("returns root slash for an empty string", () => {
    expect(normalizeRoutePath("")).toBe("/");
  });

  test("returns root slash when input is only a slash", () => {
    expect(normalizeRoutePath("/")).toBe("/");
  });

  test("leaves a path without a trailing slash unchanged", () => {
    expect(normalizeRoutePath("/guide")).toBe("/guide");
  });

  test("leaves a nested path unchanged", () => {
    expect(normalizeRoutePath("/docs/api/reference")).toBe("/docs/api/reference");
  });

  test("strips only the single trailing slash", () => {
    expect(normalizeRoutePath("/guide/api/")).toBe("/guide/api");
  });
});
