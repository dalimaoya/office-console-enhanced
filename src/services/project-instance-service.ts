import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { registryService, type RegistryEntry } from './registry-service.js';

const DATA_ROOT = path.resolve(process.cwd(), 'data', 'projects');

const STANDARD_DIRS = ['docs', 'tasks', 'reviews', 'status'];

export interface ProjectInstance {
  instanceId: string;
  name: string;
  templateId: string | null;
  status: string;
  createdAt: string;
  dataPath: string;
}

class ProjectInstanceService {
  /**
   * Create a new project instance:
   * 1. Register in objects.md as type=project
   * 2. Create standard directory structure under data/projects/{instanceId}/
   */
  async createInstance(name: string, templateId?: string): Promise<ProjectInstance> {
    const instanceId = `proj-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const dataPath = path.join(DATA_ROOT, instanceId);

    // Create standard directories
    for (const dir of STANDARD_DIRS) {
      await mkdir(path.join(dataPath, dir), { recursive: true });
    }

    // Register in objects.md
    const entry: RegistryEntry = {
      object_id: instanceId,
      type: 'project',
      title: name,
      project: instanceId,
      owner: 'system',
      status: 'active',
      created_at: now,
      file_path: `data/projects/${instanceId}/`,
    };

    await registryService.appendObject(entry);

    return {
      instanceId,
      name,
      templateId: templateId ?? null,
      status: 'active',
      createdAt: now,
      dataPath,
    };
  }

  /**
   * List all project instances from registry (type=project).
   */
  async listInstances(): Promise<ProjectInstance[]> {
    const entries = await registryService.query({ type: 'project' });
    return entries.map((e) => ({
      instanceId: e.object_id,
      name: e.title,
      templateId: null,
      status: e.status,
      createdAt: e.created_at,
      dataPath: e.file_path,
    }));
  }

  /**
   * Archive a project instance by updating its registry status.
   */
  async archiveInstance(instanceId: string): Promise<boolean> {
    return registryService.updateStatus(instanceId, 'archived');
  }
}

export const projectInstanceService = new ProjectInstanceService();
