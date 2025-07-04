import {
  Bot,
  BotMessageSquareIcon,
  Calendar1,
  CalendarCheckIcon,
  CalendarClock,
  ChartLine,
  Clock,
  Code,
  FileUpIcon,
  Mail,
  RefreshCcw,
  Workflow,
} from "lucide-react";

export const standardFeatures = [
  {
    icon: null,
    text: "Start with:",
  },
  {
    icon: Workflow,
    text: "2 workflows",
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
    text: "7-day data retention",
  },
  {
    icon: FileUpIcon,
    text: "5MB knowledge per workflow",
  },
  {
    icon: RefreshCcw,
    text: "Weekly link rescraping",
  },
];

export const basicFeatures = [
  {
    icon: null,
    text: "Everything in Free, plus:",
  },
  {
    icon: Workflow,
    text: "10 workflows",
  },
  {
    icon: Mail,
    text: "Priority email & chat support",
  },
  {
    icon: CalendarCheckIcon,
    text: "30-day data retention",
  },
  {
    icon: FileUpIcon,
    text: "50MB knowledge per workflow",
  },
  {
    icon: BotMessageSquareIcon,
    text: "10 prompt enhancements",
  },
  {
    icon: RefreshCcw,
    text: "Daily link rescraping",
  },
];

export const proFeatures = [
  {
    icon: null,
    text: "Everything in Basic, plus:",
  },
  {
    icon: Workflow,
    text: "Unlimited workflows",
  },
  {
    icon: Clock,
    text: "Early access to new features",
  },
  {
    icon: CalendarCheckIcon,
    text: "Unlimited data retention",
  },
  {
    icon: FileUpIcon,
    text: "500MB knowledge per workflow",
  },
  {
    icon: BotMessageSquareIcon,
    text: "100 prompt enhancements",
  },
  {
    icon: RefreshCcw,
    text: "Hourly link rescraping",
  },
];

export const enterpriseFeatures = [
  {
    icon: Calendar1,
    text: "Feature request prioritization",
  },
  {
    icon: Code,
    text: "Custom integrations",
  },
  {
    icon: FileUpIcon,
    text: "Custom knowledge size per workflow",
  },
  {
    icon: BotMessageSquareIcon,
    text: "Custom prompt enhancements",
  },
];
