"use client";

import { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { Bot, CalendarIcon, Circle, CircleX, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import ModelIcon from "public/models/svgs/model-icon";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function RunFilters({
  models,
  plan,
}: {
  models: ModelWithCostAndProvider[];
  plan: "hobby" | "basic" | "pro" | null;
}) {
  const router = useRouter();
  const [threadId, setThreadId] = useQueryState("threadId", {
    shallow: false,
  });
  const [modelId, setModelId] = useQueryState("modelId", {
    shallow: false,
  });
  const [status, setStatus] = useQueryState("status", { shallow: false });
  const [startDate, setStartDate] = useQueryState("startDate", {
    shallow: false,
  });
  const [endDate, setEndDate] = useQueryState("endDate", {
    shallow: false,
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [sort, setSort] = useQueryState("sort", {
    defaultValue: "createdAt:desc",
    shallow: false,
  });

  return (
    <div className="flex justify-between">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Thread ID"
          value={threadId ?? ""}
          onChange={(e) => setThreadId(e.target.value)}
          className="h-8 w-[150px]"
        />

        <Select
          value={modelId ?? "all"}
          onValueChange={(value) => {
            if (value === "all") {
              setModelId(null);
            } else {
              setModelId(value);
            }
          }}
        >
          <SelectTrigger className="max-w-[200px]">
            <SelectValue placeholder="Model" className="text-start" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Bot className="size-3 text-muted-foreground" />
                All Models
              </div>
            </SelectItem>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <ModelIcon tag={model.tag ?? ""} size="xs" />
                  {model.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status ?? "all"}
          onValueChange={(value) => {
            if (value === "all") {
              setStatus(null);
            } else {
              setStatus(value);
            }
          }}
        >
          <SelectTrigger className="max-w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Circle className="size-3 text-neutral-500" strokeWidth={2.5} />
                All
              </div>
            </SelectItem>
            <SelectItem value="RUNNING">
              <div className="flex items-center gap-2">
                <Circle className="size-3 text-yellow-500" strokeWidth={2.5} />
                Running
              </div>
            </SelectItem>
            <SelectItem value="COMPLETED">
              <div className="flex items-center gap-2">
                <Circle className="size-3 text-green-500" strokeWidth={2.5} />
                Completed
              </div>
            </SelectItem>
            <SelectItem value="FAILED">
              <div className="flex items-center gap-2">
                <Circle className="size-3 text-red-500" strokeWidth={2.5} />
                Failed
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className={cn("grid gap-2")}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                size="sm"
                className={cn(
                  "w-[225px] justify-start text-left font-normal text-sm active:scale-100",
                  (!startDate || !endDate) && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-3" />
                {startDate && endDate ? (
                  <>
                    {format(startDate, "LLL dd, y")} -{" "}
                    {format(endDate, "LLL dd, y")}
                  </>
                ) : (
                  <span>Date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="flex w-auto flex-col gap-2 p-0"
              align="center"
            >
              <Calendar
                initialFocus
                mode="range"
                disabled={(date) => {
                  // No data retention for pro users
                  if (plan === "pro") {
                    return date > new Date();
                  } else if (plan === "basic") {
                    // unsubscribed (basic) users can only select today and the last 30 days
                    return date < addDays(new Date(), -31) || date > new Date();
                  } else {
                    // unsubscribed (hobby) users can only select today and the last 7 days
                    return date < addDays(new Date(), -8) || date > new Date();
                  }
                }}
                defaultMonth={dateRange?.from ?? undefined}
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange(range);
                    setStartDate(range.from?.toISOString() ?? null);
                    setEndDate(range.to?.toISOString() ?? null);
                  }
                }}
              />
              <div className="flex w-full gap-2 px-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setDateRange({
                      from: new Date(),
                      to: addDays(new Date(), 1),
                    });
                    setStartDate(startOfDay(new Date()).toISOString());
                    setEndDate(endOfDay(new Date()).toISOString());
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setDateRange({
                      from: addDays(new Date(), -7),
                      to: new Date(),
                    });
                    setStartDate(
                      startOfDay(addDays(new Date(), -7)).toISOString(),
                    );
                    setEndDate(endOfDay(new Date()).toISOString());
                  }}
                >
                  Last 7 days
                </Button>
              </div>
              <div className="flex w-full gap-2 px-2 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full",
                    (plan === null || plan === "hobby") && "opacity-50",
                  )}
                  onClick={() => {
                    if (plan === null || plan === "hobby") {
                      router.push("/dashboard/settings");
                      return;
                    }

                    setDateRange({
                      from: addDays(new Date(), -30),
                      to: new Date(),
                    });
                    setStartDate(
                      startOfDay(addDays(new Date(), -30)).toISOString(),
                    );
                    setEndDate(endOfDay(new Date()).toISOString());
                  }}
                >
                  {(plan === null || plan === "hobby") && (
                    <Lock className="size-3" />
                  )}
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("w-full", plan !== "pro" && "opacity-50")}
                  onClick={() => {
                    if (plan !== "pro") {
                      router.push("/dashboard/settings");
                      return;
                    }

                    setDateRange({
                      from: addDays(new Date(), -90),
                      to: new Date(),
                    });
                    setStartDate(
                      startOfDay(addDays(new Date(), -90)).toISOString(),
                    );
                    setEndDate(endOfDay(new Date()).toISOString());
                  }}
                >
                  {plan !== "pro" && <Lock className="size-3" />}
                  Last 90 days
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {threadId || modelId || status || startDate || endDate ? (
          <Button
            variant="outline"
            size="icon"
            className="size-8 min-w-8"
            onClick={() => {
              setThreadId(null);
              setModelId(null);
              setStatus(null);
              setStartDate(null);
              setEndDate(null);
            }}
          >
            <CircleX className="size-4" />
          </Button>
        ) : null}
      </div>

      <Select
        defaultValue={"createdAt:desc"}
        value={sort}
        onValueChange={(value) => {
          setSort(value);
        }}
      >
        <SelectTrigger className="max-w-[150px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="createdAt:desc">Latest</SelectItem>
          <SelectItem value="createdAt:asc">Oldest</SelectItem>
          <SelectItem value="durationInMs:asc">Fastest</SelectItem>
          <SelectItem value="durationInMs:desc">Slowest</SelectItem>
          <SelectItem value="cost:asc">Cheapest</SelectItem>
          <SelectItem value="cost:desc">Most Expensive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
