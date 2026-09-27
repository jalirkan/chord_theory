import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom doesn't implement scrolling; the app scrolls to the top on navigation.
window.scrollTo = () => {};
