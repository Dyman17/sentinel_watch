/**
 * API клиент для SENTINEL.SAT Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface Detection {
  label: string
  score: number
  original_label?: string
  box: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
  }
  timestamp?: number
}

export interface AnalysisResult {
  predictions: Detection[]
  disaster_detections: Detection[]
  total_objects: number
  disasters_found: number
  timestamp: number
}

export interface LatestLog {
  disasters: number
  type: string
  confidence: number
  total_objects: number
  timestamp: number
  status: string
}

export interface HealthStatus {
  server: string
  hf: string | number
  hf_api_url: string
  clients_connected: number
  detections_count: number
}

export interface SystemStatus {
  esp32_connected: boolean
  clients_count: number
  hf_connected: boolean
  total_detections: number
  last_detection: AnalysisResult | null
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request('/api/health')
  }

  async getStatus(): Promise<SystemStatus> {
    return this.request('/api/status')
  }

  async getLatest(): Promise<LatestLog> {
    return this.request('/api/latest')
  }

  async getLogs(): Promise<{ status: string; logs: LatestLog[]; total_detections: number }> {
    return this.request('/api/logs')
  }

  async getDetections(): Promise<{ history: AnalysisResult[] }> {
    return this.request('/api/detections')
  }

  async uploadImage(file: File): Promise<{ status: string; filename: string; hf_result: any }> {
    const formData = new FormData()
    formData.append('file', file)
    return this.request('/api/upload', {
      method: 'POST',
      body: formData,
    })
  }

  createWebSocketConnection(): WebSocket {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = this.baseUrl ? new URL(this.baseUrl).host : window.location.host
    return new WebSocket(`${wsProtocol}//${wsHost}/ws/logs`)
  }

  getStreamUrl(): string {
    return `${this.baseUrl}/api/stream`
  }
}

export const apiClient = new ApiClient()
export default apiClient
