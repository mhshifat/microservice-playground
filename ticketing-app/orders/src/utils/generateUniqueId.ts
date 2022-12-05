import { randomBytes } from "crypto";

export default function generateUniqueId() {
  return randomBytes(10).toString("hex");
}