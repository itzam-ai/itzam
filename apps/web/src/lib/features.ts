import {
  Bot,
  BotMessageSquareIcon,
  Calendar1,
  CalendarCheckIcon,
  CalendarClock,
  ChartLine,
  CirclePlus,
  Code,
  Mail,
  Workflow,
} from "lucide-react";

export const standardFeatures = [
  {
    icon: Workflow,
    text: "Unlimited workflows",
  },
  {
    icon: Bot,
    text: "Model & Prompt hot-swap",
  },
  {
    icon: ChartLine,
    text: "Cost & Usage analytics",
  },
  {
    icon: CalendarClock,
    text: "30-day data retention",
  },
  {
    icon: BotMessageSquareIcon,
    text: "10 prompt enhancements",
  },
];

export const proFeatures = [
  {
    icon: null,
    text: "Everything in Free, plus:",
  },
  {
    icon: CalendarCheckIcon,
    text: "Unlimited data retention",
  },
  {
    icon: BotMessageSquareIcon,
    text: "100 prompt enhancements",
  },
  {
    icon: CirclePlus,
    text: "Early access to new features",
  },
  {
    icon: Mail,
    text: "Priority email & chat support",
  },
];

export const enterpriseFeatures = [
  {
    icon: null,
    text: "Everything in Pro, plus:",
  },
  {
    icon: Calendar1,
    text: "Feature request prioritization",
  },
  {
    icon: Code,
    text: "Custom integrations",
  },
];
