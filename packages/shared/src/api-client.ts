import type { TodayResponse, TasksListResponse, CoylTask, CoylUser, CreateTaskInput } from './types'

export class CoylApiClient {
  private baseUrl: string
  private getToken: () => Promise<string | null>

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.getToken = getToken
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken()
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  async getToday(): Promise<TodayResponse> {
    return this.fetch('/api/v1/today')
  }

  async getTasks(): Promise<TasksListResponse> {
    return this.fetch('/api/v1/tasks')
  }

  async createTask(input: CreateTaskInput): Promise<CoylTask> {
    return this.fetch('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async completeTask(taskId: string): Promise<CoylTask> {
    return this.fetch(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
  }

  async getUser(): Promise<CoylUser> {
    return this.fetch('/api/v1/user')
  }
}
