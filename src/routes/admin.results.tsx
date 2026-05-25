import { createFileRoute } from "@tanstack/react-router";
import { AdminResults } from "./admin";

export const Route = createFileRoute("/admin/results")({
  component: AdminResults,
});
