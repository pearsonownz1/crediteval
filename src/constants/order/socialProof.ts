import { Award, Lock, ShieldCheck } from "lucide-react";

export const SOCIAL_PROOF_ITEMS = [
  {
    icon: Award,
    title: "100% Acceptance",
    text: "Our translations & evaluations meet the requirements for certified translation acceptance — it's guaranteed.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    text: "Your documents are securely stored and only transmitted via encrypted means.",
  },
  {
    icon: ShieldCheck,
    title: "Professionally Translated & Evaluated",
    text: "Your certified translation and academic evaluations will be completed by a professional translator in combination with an expert evaluator.",
  },
] as const;
