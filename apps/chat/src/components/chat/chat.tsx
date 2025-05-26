"use client";

import { useChat } from "@ai-sdk/react";
import { ChatWithMessages } from "@itzam/server/db/chat/actions";
import { Model, ModelWithProvider } from "@itzam/server/db/model/actions";
import {
  calculateInputCost,
  calculateOutputCost,
} from "@itzam/server/db/run/utils";
import {
  Message as AiMessage,
  createIdGenerator,
  LanguageModelUsage,
} from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import {
  AlertTriangle,
  ArrowUp,
  BarChart,
  BicepsFlexed,
  Brain,
  ChevronsUpDown,
  Code,
  CreditCard,
  Eye,
  Gem,
  ImageIcon,
  MessageCircleIcon,
  RefreshCcw,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 } from "uuid";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInputWithFilters,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { chatMetadataAtom } from "~/lib/atoms";
import { FREE_MODELS, MAX_MESSAGES_PER_DAY } from "~/lib/config";
import { uploadImageToR2 } from "~/lib/r2-client";
import { useKeyboardShortcut } from "~/lib/shortcut";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { Badge } from "../ui/badge";
import { ChatContainer } from "../ui/chat-container";
import { FileUpload, FileUploadContent } from "../ui/file-upload";
import { ProgressiveBlur } from "../ui/progressive-blur";
import { ScrollButton } from "../ui/scroll-button";
import { TextShimmer } from "../ui/text-shimmer";
import { FilterButton } from "./filter-button";
import { Message } from "./message";

interface ExtendedMessage extends AiMessage {
  modelTag?: string;
  modelName?: string;
  tokensUsed?: number;
  tokensWithContext?: number;
  cost?: string;
}

interface ExtendedFile extends File {
  id: string;
  url: string | null;
}

export default function Chat({
  chat,
  models,
  hasActiveSubscription,
  messagesSentToday,
}: {
  chat: ChatWithMessages;
  models: ModelWithProvider[];
  hasActiveSubscription: boolean;
  messagesSentToday: number;
}) {
  const [selectedModel, setSelectedModel] = useState<Model | null>(
    models.find((m) => m.tag === chat.lastModelTag) ?? null
  );

  const { user } = useCurrentUser();

  const [, setChatMetadata] = useAtom(chatMetadataAtom);

  const [userMessagesSentToday, setUserMessagesSentToday] =
    useState(messagesSentToday);
  const [showStats, setShowStats] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(true);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tab -> focus on textarea
  useKeyboardShortcut("Tab", false, () => {
    textareaRef.current?.focus();
  });

  // CMD + Shift + M -> open model selector
  useKeyboardShortcut("m", true, () => {
    setModelSelectorOpen((prev) => !prev);
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    error,
    reload,
    setMessages,
  } = useChat({
    id: chat.id,
    initialMessages: chat.messages as ExtendedMessage[],
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    experimental_prepareRequestBody({ messages, id }) {
      const lastMessage = messages[messages.length - 1];
      return {
        message: lastMessage,
        id,
        modelTag: selectedModel?.tag,
      };
    },
    onResponse(response) {
      const messagesSentToday = response.headers.get(
        "x-itzam-messages-sent-today"
      );

      setUserMessagesSentToday(parseInt(messagesSentToday ?? "0"));
    },
    onFinish(message: AiMessage, options: { usage: LanguageModelUsage }) {
      setMessages((prevMessages) => {
        const extendedAssistantMessage = message as ExtendedMessage;

        // Updating the metadata of the assistant message
        extendedAssistantMessage.modelTag = selectedModel?.tag;
        extendedAssistantMessage.modelName = selectedModel?.name;
        extendedAssistantMessage.tokensUsed = options.usage.completionTokens;
        extendedAssistantMessage.cost = calculateOutputCost(
          selectedModel?.outputPerMillionTokenCost ?? "0",
          options.usage.completionTokens
        ).toString();

        const oldMessages = [...prevMessages];

        const lastUserMessage = [...oldMessages]
          .reverse()
          .find((m: ExtendedMessage) => m.role === "user") as ExtendedMessage;

        const userMessageCost = calculateInputCost(
          selectedModel?.inputPerMillionTokenCost ?? "0",
          options.usage.promptTokens
        ).toString();

        const totalTokensInContext = prevMessages.reduce(
          (acc, message: ExtendedMessage) => {
            return acc + (message.tokensUsed ?? 0);
          },
          0
        );

        // Updating the metadata of the user message
        lastUserMessage.cost = userMessageCost;
        lastUserMessage.tokensUsed =
          options.usage.promptTokens - totalTokensInContext;
        lastUserMessage.tokensWithContext = options.usage.promptTokens;

        const newMessages = [...oldMessages];

        // Removing the last two messages (the user message and the assistant message)
        newMessages.pop();
        newMessages.pop();

        // Adding the updated user message and assistant message
        newMessages.push(lastUserMessage);
        newMessages.push(extendedAssistantMessage);

        // Update the chat metadata
        setChatMetadata((prev) => {
          const totalMessages = prev.totalMessages + 2;
          const tokensUsed = prev.tokensUsed + options.usage.totalTokens;
          const cost =
            prev.cost +
            Number(userMessageCost) +
            Number(extendedAssistantMessage.cost ?? 0);

          return {
            ...prev,
            tokensUsed,
            cost,
            totalMessages,
          };
        });

        return newMessages;
      });
    },
    onError(error) {
      console.error(error);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  const handleSendMessage = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      !hasActiveSubscription &&
      userMessagesSentToday >= MAX_MESSAGES_PER_DAY
    ) {
      toast.error(
        "You have reached the limit of free messages today. Subscribe to continue."
      );
      return;
    }

    const attachments = files.map((file) => ({
      url: file.url ?? URL.createObjectURL(file),
      name: file.name,
      contentType: file.type,
    }));

    e.preventDefault();

    handleSubmit(e, {
      experimental_attachments: attachments,
    });

    setUserMessagesSentToday((prev) => prev + 1);

    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddFiles = async (newFiles: File[]) => {
    setIsUploadingFiles(true);

    // Create proper ExtendedFile objects with all File properties
    const filesWithIds = newFiles.map((file) => {
      // Create a new File object with all original properties
      const extendedFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      }) as ExtendedFile;

      // Add our custom properties while preserving all File properties
      Object.defineProperties(extendedFile, {
        id: { value: v4(), writable: true },
        url: { value: null, writable: true },
      });

      return extendedFile;
    });

    // Add the new files to state first
    setFiles((prevFiles) => [...prevFiles, ...filesWithIds]);

    // upload the files to r2
    const uploadedFiles = await Promise.all(
      filesWithIds.map((file) =>
        uploadImageToR2(file, file.id, user?.id ?? "").catch((error) => {
          console.error(error);
          toast.error(error.message);
          return {
            ...file,
            id: file.id,
            imageUrl: null,
          };
        })
      )
    );

    // Remove files that failed to upload
    const filesToRemove = uploadedFiles.filter(
      (file) => file.imageUrl === null
    );

    setFiles((prevFiles) =>
      prevFiles.filter((file) => !filesToRemove.some((f) => f.id === file.id))
    );

    // Update the files in state with their URLs
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        const uploadedFile = uploadedFiles.find((f) => f?.id === file.id);
        if (uploadedFile?.imageUrl) {
          file.url = uploadedFile.imageUrl;
        }
        return file;
      })
    );

    setIsUploadingFiles(false);
  };

  const fileList = useMemo(() => {
    if (!files.length) return null;
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
          filter: "blur(4px)",
          height: "auto",
        }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          height: "auto",
        }}
        exit={{
          opacity: 0,
          y: 10,
          filter: "blur(4px)",
          height: "auto",
        }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-4 gap-2 px-2 py-3 mx-6 bg-muted/70 rounded-t-3xl border border-b-0 border-muted-foreground/20"
      >
        {files.map((file: ExtendedFile, index: number) => (
          <div
            key={index}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
              file.url ? "opacity-100" : "opacity-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Image
                src={file.url ?? URL.createObjectURL(file)}
                alt={file.name}
                className="size-6 rounded-sm"
                width={24}
                height={24}
              />
              <span className="truncate max-w-[100px] text-sm">
                {file.name}
              </span>
            </div>
            <button
              onClick={() => setFiles(files.filter((_, i) => i !== index))}
              className="hover:bg-secondary/50 rounded-sm p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </motion.div>
    );
  }, [files]);

  if (!selectedModel || models.length === 0) {
    return (
      <div className="flex flex-col gap-4 w-full h-full justify-center items-center mt-48">
        <p className="text-muted-foreground">No models available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-3xl mx-auto relative px-6 md:px-2">
      <FileUpload onFilesAdded={handleAddFiles} accept=".jpg,.jpeg,.png">
        <ChatContainer
          ref={chatContainerRef}
          className="flex flex-col gap-4 pt-24 pb-64"
        >
          <ProgressiveBlur
            className="pointer-events-none fixed left-1/2 -translate-x-1/2 top-0 h-16 w-full max-w-5xl z-50 hidden md:block"
            direction="top"
            blurIntensity={0.5}
          />
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message as ExtendedMessage}
              isLast={message.id === messages[messages.length - 1]?.id}
              reload={reload}
              status={status}
            />
          ))}
          {status !== "streaming" && status === "submitted" && (
            <div className="flex items-center gap-2">
              <ModelIcon tag={selectedModel.tag} size="sm" />
              <TextShimmer className="font-mono text-sm" duration={2}>
                {`${selectedModel.name} is thinking...`}
              </TextShimmer>
            </div>
          )}

          {error && (
            <div className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              An error occurred.
              <Button
                variant="ghost"
                onClick={() => reload()}
                className="text-foreground"
                size="icon"
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="absolute inset-0 flex justify-center items-center">
              <EmptyStateDetails
                title="No messages yet"
                description="Start a conversation with AI"
                icon={<MessageCircleIcon className="size-8" />}
              />
            </div>
          )}
        </ChatContainer>

        <div className="fixed bottom-0 left-0 right-0">
          <div className="w-full flex justify-center">
            <div className="flex flex-col max-w-3xl w-full px-4 md:px-0">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4">
                <ScrollButton
                  containerRef={chatContainerRef}
                  className="shadow-md"
                />
              </div>
              <div className="w-full max-w-3xl bg-background md:pb-12 pb-6 rounded-t-3xl">
                <AnimatePresence>{fileList}</AnimatePresence>
                <form onSubmit={handleSendMessage}>
                  <div className="flex flex-col p-4 pl-5 rounded-3xl dark:bg-muted border border-muted-foreground/20 gap-2 shadow-lg">
                    {/* div for text area and image attachment */}
                    <div className="flex gap-2 items-start">
                      <textarea
                        ref={textareaRef}
                        autoFocus
                        rows={1}
                        value={input}
                        onKeyDown={handleKeyDown}
                        onChange={handleInputChange}
                        style={{ height: "auto" }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                        className="flex-1 border-0 mt-1 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 outline-none bg-transparent placeholder:text-muted-foreground/50 text-foreground"
                        placeholder="Ask AI anything..."
                        disabled={status !== "ready"}
                      />

                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                multiple
                                onChange={(e) => {
                                  if (e.target.files?.length) {
                                    handleAddFiles(Array.from(e.target.files!));
                                    e.target.value = "";
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={
                                  status !== "ready" || !selectedModel.hasVision
                                }
                                className={`hover:opacity-80 transition-opacity disabled:opacity-50 mr-1.5 ${
                                  status !== "ready" || !selectedModel.hasVision
                                    ? "opacity-50"
                                    : ""
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <ImageIcon className="text-primary size-5 mt-1" />
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            className={
                              status !== "ready" || !selectedModel.hasVision
                                ? "opacity-0"
                                : ""
                            }
                          >
                            <p>
                              {selectedModel.hasVision
                                ? "Attach an image"
                                : "Model does not support images"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* div for model selector and send button */}
                    <div className="flex items-center justify-between">
                      <Popover
                        open={modelSelectorOpen}
                        onOpenChange={setModelSelectorOpen}
                      >
                        <PopoverTrigger asChild>
                          <button
                            className="flex items-center gap-2 hover:opacity-70 transition-opacity outline-none focus:outline-none"
                            role="combobox"
                            aria-expanded={modelSelectorOpen}
                          >
                            <ModelIcon tag={selectedModel.tag} size="sm" />
                            <span className="text-sm">
                              {selectedModel.name}
                            </span>
                            <ChevronsUpDown className="text-muted-foreground size-4 ml-0.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[400px] p-0 px-2"
                          align="start"
                          sideOffset={12}
                        >
                          <Command>
                            <CommandInputWithFilters placeholder="Search model...">
                              <div className="flex justify-end items-center gap-2">
                                <FilterButton
                                  onClick={() => setShowStats(!showStats)}
                                  icon={<BarChart className="size-4" />}
                                  active={showStats}
                                  tooltip="Show stats"
                                />
                                <FilterButton
                                  onClick={() =>
                                    setShowCapabilities(!showCapabilities)
                                  }
                                  icon={<BicepsFlexed className="size-4" />}
                                  active={showCapabilities}
                                  tooltip="Show capabilities"
                                />
                              </div>
                            </CommandInputWithFilters>

                            {/* filter */}
                            <CommandList>
                              <CommandEmpty>No model found.</CommandEmpty>
                              <CommandGroup>
                                {models.map((model) => (
                                  <CommandItem
                                    key={model.id}
                                    value={model.id}
                                    className="p-4 cursor-pointer"
                                    keywords={[model.name]}
                                    disabled={
                                      !hasActiveSubscription &&
                                      !FREE_MODELS.includes(model.tag)
                                    }
                                    onSelect={(currentValue) => {
                                      const model = models.find(
                                        (m) => m.id === currentValue
                                      );
                                      if (model) {
                                        setSelectedModel(model);

                                        if (!model.hasVision) {
                                          setFiles([]);
                                        }
                                      }

                                      setModelSelectorOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col cursor-pointer w-full">
                                      <div className="flex items-center gap-2 w-full h-fit">
                                        <ModelIcon tag={model.tag} size="sm" />
                                        <span className="font-medium">
                                          {model.name}
                                        </span>
                                        {model.id === selectedModel.id && (
                                          <Badge variant="outline" size="sm">
                                            Current
                                          </Badge>
                                        )}

                                        <div className="ml-auto flex gap-1">
                                          {!FREE_MODELS.includes(model.tag) &&
                                            !hasActiveSubscription && (
                                              <TooltipProvider>
                                                <Tooltip delayDuration={100}>
                                                  <TooltipTrigger>
                                                    <div className="flex cursor-pointer items-center gap-1 rounded-md border border-purple-600/20 bg-purple-600/10 p-1 text-purple-600 transition-all duration-200 hover:border-purple-600/30 hover:bg-purple-600/20">
                                                      <Gem className="size-3" />
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Premium model</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          {showCapabilities && (
                                            <>
                                              {model.hasReasoningCapability && (
                                                <TooltipProvider>
                                                  <Tooltip delayDuration={100}>
                                                    <TooltipTrigger>
                                                      <div className="flex cursor-pointer items-center gap-1 rounded-md border border-green-600/20 bg-green-600/10 p-1 text-green-600 transition-all duration-200 hover:border-green-600/30 hover:bg-green-600/20">
                                                        <Brain className="size-3" />
                                                      </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>
                                                        Thinks before answering
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                              {model.hasVision && (
                                                <TooltipProvider>
                                                  <Tooltip delayDuration={100}>
                                                    <TooltipTrigger>
                                                      <div className="flex cursor-pointer items-center gap-1 rounded-md border border-sky-600/20 bg-sky-600/10 p-1 text-sky-600 transition-all duration-200 hover:border-sky-600/30 hover:bg-sky-600/20">
                                                        <Eye className="size-3" />
                                                      </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>
                                                        Vision capability (image
                                                        input)
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                              {model.isOpenSource && (
                                                <TooltipProvider>
                                                  <Tooltip delayDuration={100}>
                                                    <TooltipTrigger>
                                                      <div className="flex cursor-pointer items-center gap-1 rounded-md border border-orange-600/20 bg-orange-600/10 p-1 text-orange-600 transition-all duration-200 hover:border-orange-600/30 hover:bg-orange-600/20">
                                                        <Code className="size-3" />
                                                      </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>
                                                        The model is open source
                                                        and available for anyone
                                                        to use.
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {showStats && (
                                        <div>
                                          <div className="grid grid-cols-4 gap-6 text-xs text-muted-foreground mt-2">
                                            <div className="flex flex-col items-start gap-1">
                                              <span className="font-medium">
                                                Context
                                              </span>
                                              <span className="text-foreground">
                                                {model.contextWindowSize.toLocaleString()}{" "}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-start gap-1">
                                              <span className="font-medium">
                                                Max Tokens
                                              </span>
                                              <span className="text-foreground">
                                                {model.maxTokens.toLocaleString()}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-start gap-1">
                                              <span className="font-medium">
                                                Input
                                              </span>
                                              <span className="text-foreground">
                                                $
                                                {Number(
                                                  model.inputPerMillionTokenCost
                                                )?.toFixed(2)}
                                                /M
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-start gap-1">
                                              <span className="font-medium">
                                                Output
                                              </span>
                                              <span className="text-foreground">
                                                $
                                                {Number(
                                                  model.outputPerMillionTokenCost
                                                )?.toFixed(2)}
                                                /M
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="flex items-center gap-4">
                        {!hasActiveSubscription && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              {userMessagesSentToday} / {MAX_MESSAGES_PER_DAY}
                            </p>
                            {userMessagesSentToday >= MAX_MESSAGES_PER_DAY && (
                              <Link href="https://itz.am/dashboard/settings">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  type="button"
                                >
                                  <CreditCard className="size-4" />
                                  Subscribe
                                </Button>
                              </Link>
                            )}
                          </>
                        )}

                        {status === "submitted" || status === "streaming" ? (
                          <Button
                            type="submit"
                            size="icon"
                            variant="primary"
                            className=" rounded-full"
                            onClick={() => stop()}
                          >
                            <Square className="w-4 h-4" fill="currentColor" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            size="icon"
                            variant="primary"
                            disabled={
                              status !== "ready" ||
                              isUploadingFiles ||
                              (!hasActiveSubscription &&
                                userMessagesSentToday >= MAX_MESSAGES_PER_DAY)
                            }
                            className=" rounded-full"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <FileUploadContent>
          <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
            <div className="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
              <div className="mb-4 flex justify-center">
                <svg
                  className="text-muted size-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-center text-base font-medium">
                Drop files to upload
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                Release to add files to your message
              </p>
            </div>
          </div>
        </FileUploadContent>
      </FileUpload>
    </div>
  );
}
