"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Code,
  FileText,
  Image,
  Calculator,
  Globe,
  Database,
  Mail,
  Loader2,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useParams } from "next/navigation";
import { updateWorkflowTools } from "@itzam/server/db/workflow/actions";
import {
  getAllTools,
  getWorkflowTools,
  getUserToolApiKey,
  saveUserToolApiKey,
} from "@itzam/server/db/tools/actions";
import { toast } from "sonner";

interface Tool {
  id: string;
  type: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  apiKeyName: string | null;
  isActive: boolean;
}

const getToolIcon = (type: string) => {
  switch (type) {
    case "WEB_SEARCH":
      return <Search className="h-4 w-4" />;
    case "CODE_INTERPRETER":
      return <Code className="h-4 w-4" />;
    case "FILE_READER":
      return <FileText className="h-4 w-4" />;
    case "IMAGE_GENERATION":
      return <Image className="h-4 w-4" />;
    case "CALCULATOR":
      return <Calculator className="h-4 w-4" />;
    case "API_CALLER":
      return <Globe className="h-4 w-4" />;
    case "DATABASE_QUERY":
      return <Database className="h-4 w-4" />;
    case "EMAIL_SENDER":
      return <Mail className="h-4 w-4" />;
    default:
      return <Code className="h-4 w-4" />;
  }
};

const getToolCategory = (type: string) => {
  switch (type) {
    case "WEB_SEARCH":
      return "Research";
    case "CODE_INTERPRETER":
    case "API_CALLER":
      return "Development";
    case "FILE_READER":
      return "File Processing";
    case "IMAGE_GENERATION":
      return "Creative";
    case "CALCULATOR":
      return "Utilities";
    case "DATABASE_QUERY":
      return "Data";
    case "EMAIL_SENDER":
      return "Communication";
    default:
      return "Other";
  }
};

export function WorkflowTools() {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [workflowTools, setWorkflowTools] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [apiKeys, setApiKeys] = useState<Map<string, string>>(new Map());
  const [apiKeyInputs, setApiKeyInputs] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function loadTools() {
      try {
        // Load all available tools
        const toolsResult = await getAllTools();
        if ("error" in toolsResult) {
          toast.error("Failed to load tools");
          return;
        }
        setAllTools(toolsResult);

        // Load workflow-specific tools
        const workflowToolsResult = await getWorkflowTools(workflowId);
        if ("error" in workflowToolsResult) {
          toast.error("Failed to load workflow tools");
          return;
        }

        // Create a map of tool ID to enabled status
        const toolsMap = new Map<string, boolean>();
        for (const wt of workflowToolsResult) {
          toolsMap.set(wt.tool.id, wt.enabled);
        }
        setWorkflowTools(toolsMap);

        // Load API keys for tools that require them
        const keysMap = new Map<string, string>();
        const inputsMap = new Map<string, string>();

        for (const tool of toolsResult) {
          if (tool.requiresApiKey) {
            const keyResult = await getUserToolApiKey(tool.id);
            if (!("error" in keyResult) && keyResult.apiKey) {
              // Mask the API key for display
              const maskedKey =
                keyResult.apiKey.substring(0, 4) +
                "****" +
                keyResult.apiKey.substring(keyResult.apiKey.length - 4);
              keysMap.set(tool.id, maskedKey);
              inputsMap.set(tool.id, ""); // Don't show the actual key in the input
            }
          }
        }

        setApiKeys(keysMap);
        setApiKeyInputs(inputsMap);
      } catch (error) {
        toast.error("Failed to load tools");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadTools();
  }, [workflowId]);

  const handleToggleTool = (toolId: string) => {
    const newMap = new Map(workflowTools);
    const currentEnabled = newMap.get(toolId) || false;
    newMap.set(toolId, !currentEnabled);
    setWorkflowTools(newMap);
    setHasChanges(true);

    // If disabling a tool, clear its API key input
    if (currentEnabled) {
      const newInputs = new Map(apiKeyInputs);
      newInputs.set(toolId, "");
      setApiKeyInputs(newInputs);
    }
  };

  const handleApiKeyChange = (toolId: string, value: string) => {
    const newInputs = new Map(apiKeyInputs);
    newInputs.set(toolId, value);
    setApiKeyInputs(newInputs);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get list of enabled tool IDs
      const enabledToolIds = allTools
        .filter((tool) => workflowTools.get(tool.id) || false)
        .map((tool) => tool.id);

      // Check if any enabled tools requiring API keys don't have them
      const toolsNeedingKeys = allTools.filter(
        (tool) =>
          tool.requiresApiKey &&
          (workflowTools.get(tool.id) || false) &&
          !apiKeys.has(tool.id) &&
          !apiKeyInputs.get(tool.id),
      );

      if (toolsNeedingKeys.length > 0) {
        toast.error(
          `Please provide API keys for: ${toolsNeedingKeys.map((t) => t.name).join(", ")}`,
        );
        return;
      }

      // Save API keys first
      for (const tool of allTools) {
        if (tool.requiresApiKey && (workflowTools.get(tool.id) || false)) {
          const newKey = apiKeyInputs.get(tool.id);
          if (newKey && newKey.trim()) {
            const keyName = tool.apiKeyName || `${tool.name} API Key`;
            const saveResult = await saveUserToolApiKey(
              tool.id,
              newKey,
              keyName,
            );
            if (!saveResult || "error" in saveResult) {
              toast.error(`Failed to save API key for ${tool.name}`);
              return;
            }
          }
        }
      }

      // Then update workflow tools
      const result = await updateWorkflowTools(workflowId, enabledToolIds);
      if ("error" in result) {
        toast.error("Failed to save tools configuration");
        return;
      }

      toast.success("Tools configuration saved");
      setHasChanges(false);

      // Reload to refresh API key display
      window.location.reload();
    } catch (error) {
      toast.error("Failed to save tools configuration");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const enabledToolsCount = allTools.filter(
    (tool) => workflowTools.get(tool.id) || false,
  ).length;

  const groupedTools = allTools.reduce(
    (acc, tool) => {
      const category = getToolCategory(tool.type);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(tool);
      return acc;
    },
    {} as Record<string, Tool[]>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tools Configuration</h2>
        <p className="text-muted-foreground">
          Configure which tools your AI workflow can access. Enabling tools
          gives your workflow additional capabilities to interact with external
          systems and process information.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Tools</h3>
            <Badge variant="gray">
              {enabledToolsCount} tool{enabledToolsCount !== 1 ? "s" : ""}{" "}
              enabled
            </Badge>
          </div>

          <div className="space-y-8">
            {Object.entries(groupedTools).map(([category, categoryTools]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {category}
                </h4>
                <div className="space-y-3">
                  {categoryTools.map((tool) => {
                    const isEnabled = workflowTools.get(tool.id) || false;
                    const hasExistingKey = apiKeys.has(tool.id);

                    return (
                      <div key={tool.id} className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              {getToolIcon(tool.type)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={tool.id}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {tool.name}
                                </Label>
                                {tool.requiresApiKey && (
                                  <Badge variant="amber" size="sm">
                                    API Key Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id={tool.id}
                            checked={isEnabled}
                            onCheckedChange={() => handleToggleTool(tool.id)}
                          />
                        </div>

                        {/* Show API key input when tool is enabled and requires key */}
                        {isEnabled && tool.requiresApiKey && (
                          <div className="ml-7 rounded-lg bg-muted/50 p-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`${tool.id}-api-key`}
                                className="text-sm"
                              >
                                {tool.apiKeyName || `${tool.name} API Key`}
                                {hasExistingKey && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Currently set: {apiKeys.get(tool.id)})
                                  </span>
                                )}
                              </Label>
                              <Input
                                id={`${tool.id}-api-key`}
                                type="password"
                                placeholder={
                                  hasExistingKey
                                    ? "Enter new API key to update"
                                    : "Enter your API key"
                                }
                                value={apiKeyInputs.get(tool.id) || ""}
                                onChange={(e) =>
                                  handleApiKeyChange(tool.id, e.target.value)
                                }
                                className="font-mono"
                              />
                              <p className="text-xs text-muted-foreground">
                                Your API key will be securely stored and used
                                only for this workflow.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          disabled={!hasChanges || saving}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button disabled={!hasChanges || saving} onClick={handleSave}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
