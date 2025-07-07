import {
  Bot,
  BotMessageSquareIcon,
  Calendar1,
  CalendarCheckIcon,
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
    text: "Model hot-swap",
  },
  {
    icon: ChartLine,
    text: "Analytics",
  },
  {
    icon: CalendarCheckIcon,
    text: "7-day data retention",
  },
  {
    icon: RefreshCcw,
    text: "Weekly link rescraping",
  },
  {
    icon: FileUpIcon,
    text: "5MB knowledge per workflow",
  },
];

export const basicFeatures = [
  {
    icon: null,
    text: "Everything in Hobby, plus:",
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
    icon: BotMessageSquareIcon,
    text: "10 prompt enhancements",
  },
  {
    icon: CalendarCheckIcon,
    text: "30-day data retention",
  },

  {
    icon: RefreshCcw,
    text: "Daily link rescraping",
  },
  {
    icon: FileUpIcon,
    text: "50MB knowledge per workflow",
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
    text: "Early access to features",
  },
  {
    icon: BotMessageSquareIcon,
    text: "100 prompt enhancements",
  },
  {
    icon: CalendarCheckIcon,
    text: "Unlimited data retention",
  },

  {
    icon: RefreshCcw,
    text: "Hourly link rescraping",
  },
  {
    icon: FileUpIcon,
    text: "500MB knowledge per workflow",
  },
];

export const enterpriseFeatures = [
  {
    icon: null,
    text: "Everything in Pro, plus:",
  },
  {
    icon: Calendar1,
    text: "Feature prioritization",
  },
  {
    icon: Code,
    text: "Custom integrations",
  },
  {
    icon: BotMessageSquareIcon,
    text: "1000 prompt enhancements",
  },
  {
    icon: FileUpIcon,
    text: "Custom knowledge per workflow",
  },
];
