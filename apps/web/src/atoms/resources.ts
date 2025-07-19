import { Knowledge } from "@itzam/server/db/knowledge/actions";
import { ResourceUpdatePayload } from "@itzam/supabase/client";
import { atom } from "jotai";

export type ResourceWithProcessedChunks = Knowledge["resources"][number] & {
  processedChunks?: number;
};

export type ContextPageState = {
  workflowId: string;
  contextId: string;
  context: any | null;
  plan: "hobby" | "basic" | "pro" | null;
  availableStorage: number;
  isLoading: boolean;
};

// Factory function to create context-specific atoms
export const createContextAtoms = (contextId: string) => {
  // Base state atom
  const contextStateAtom = atom<ContextPageState>({
    workflowId: "",
    contextId: "",
    context: null,
    plan: null,
    availableStorage: 0,
    isLoading: true,
  });

  // Resources atom
  const resourcesAtom = atom<ResourceWithProcessedChunks[]>([]);

  // Derived atoms for filtered resources
  const fileResourcesAtom = atom((get) =>
    get(resourcesAtom).filter((resource) => resource.type === "FILE")
  );

  const linkResourcesAtom = atom((get) =>
    get(resourcesAtom).filter((resource) => resource.type === "LINK")
  );

  // Write-only atoms for resource operations
  const addResourcesAtom = atom(
    null,
    (get, set, newResources: ResourceWithProcessedChunks[]) => {
      const currentResources = get(resourcesAtom);
      set(resourcesAtom, [...newResources, ...currentResources]);
    }
  );

  const deleteResourceAtom = atom(null, (get, set, resourceId: string) => {
    const currentResources = get(resourcesAtom);
    set(
      resourcesAtom,
      currentResources.filter((resource) => resource.id !== resourceId)
    );
  });

  const removeResourcesAtom = atom(null, (get, set, resourceIds: string[]) => {
    const currentResources = get(resourcesAtom);
    set(
      resourcesAtom,
      currentResources.filter((resource) => !resourceIds.includes(resource.id))
    );
  });

  // Atom for handling real-time updates
  const updateResourceAtom = atom(
    null,
    (get, set, payload: ResourceUpdatePayload) => {
      const currentResources = get(resourcesAtom);
      set(
        resourcesAtom,
        currentResources.map((resource) => {
          if (resource.id === payload.resourceId) {
            // Only update fields that are present in the payload (partial updates)
            const updatedResource = { ...resource };

            if (
              payload.status !== undefined &&
              payload.status !== "PROCESSED"
            ) {
              updatedResource.status = payload.status;
            }
            if (payload.title !== undefined)
              updatedResource.title = payload.title;
            if (payload.fileSize !== undefined)
              updatedResource.fileSize = payload.fileSize;
            if (payload.processedChunks !== undefined) {
              updatedResource.processedChunks =
                (updatedResource.processedChunks ?? 0) +
                payload.processedChunks;
              if (
                (updatedResource.processedChunks ?? 0) >=
                (updatedResource.totalChunks ?? 1)
              )
                updatedResource.status = "PROCESSED";
            }
            if (payload.totalChunks !== undefined && payload.totalChunks !== 0)
              updatedResource.totalChunks = payload.totalChunks;

            return updatedResource;
          }
          return resource;
        })
      );
    }
  );

  // Derived atom for total size
  const totalSizeAtom = atom((get) => {
    const resources = get(resourcesAtom);
    return resources.reduce(
      (acc, resource) => acc + (resource.fileSize ?? 0),
      0
    );
  });

  return {
    contextStateAtom,
    resourcesAtom,
    fileResourcesAtom,
    linkResourcesAtom,
    addResourcesAtom,
    deleteResourceAtom,
    removeResourcesAtom,
    updateResourceAtom,
    totalSizeAtom,
  };
};

// Global map to store atoms for different contexts
const contextAtomsMap = new Map<
  string,
  ReturnType<typeof createContextAtoms>
>();

export const getContextAtoms = (contextId: string) => {
  if (!contextAtomsMap.has(contextId)) {
    contextAtomsMap.set(contextId, createContextAtoms(contextId));
  }
  return contextAtomsMap.get(contextId)!;
};
