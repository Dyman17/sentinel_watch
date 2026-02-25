/**
 * 🛰️ API клиент для Catastrophe Watch Backend
 * Интеграция с Python FastAPI бэкендом
 */

const API_BASE_URL = 'http://localhost:8000/api/v1'

export interface SatelliteData {
  id: string
  satellite_id: string
  latitude: number
  longitude: number
  altitude: number
  image_url?: string
  created_at: string
  analysis_result?: {
    has_catastrophe: boolean
    catastrophe_type?: string
    confidence?: number
    severity?: string
    description?: string
  }
}

export interface Event {
  id: string
  satellite_data_id: string
  event_type: string
  severity: string
  confidence: number
  latitude: number
  longitude: number
  region: string
  description?: string
  bbox?: number[]
  metadata?: any
  status: string
  created_at: string
}

export interface Satellite {
  id: string
  name: string
  status: string
  last_seen: string
  mode: string
  latitude?: number
  longitude?: number
  altitude?: number
}

export interface Statistics {
  total_events: number
  recent_24h: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
}

export interface HealthStatus {
  status: string
  timestamp: string
  version: string
  services: {
    database: string
    satellite_manager: string
    event_engine: string
    websocket_manager: string
  }
}

export interface Metrics {
  timestamp: string
  satellites: any
  events: any
  websocket_connections: number
  system: {
    uptime: string
    memory_usage: string
    cpu_usage: string
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData?.error?.message || 
          errorData?.detail || 
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Health & Metrics
  async getHealth(): Promise<HealthStatus> {
    return this.request('/health')
  }

  async getMetrics(): Promise<Metrics> {
    return this.request('/metrics')
  }

  // Events
  async getEvents(params: {
    limit?: number
    severity?: string
    event_type?: string
    region?: string
  } = {}): Promise<{ success: boolean; events: Event[] }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const query = searchParams.toString()
    const endpoint = `/events${query ? `?${query}` : ''}`
    
    return this.request(endpoint)
  }

  async getEvent(id: string): Promise<{ success: boolean; event: Event }> {
    return this.request(`/events/${id}`)
  }

  async getStatistics(): Promise<{ success: boolean; statistics: Statistics }> {
    return this.request('/statistics')
  }

  // Satellites
  async getSatellites(): Promise<{ success: boolean; satellites: Satellite[] }> {
    return this.request('/satellites')
  }

  async getSatellite(id: string): Promise<{ success: boolean; satellite: Satellite }> {
    return this.request(`/satellites/${id}`)
  }

  async getSatelliteData(satelliteId: string, params: {
    limit?: number
    start_date?: string
    end_date?: string
  } = {}): Promise<{ success: boolean; data: SatelliteData[] }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const query = searchParams.toString()
    const endpoint = `/satellites/${satelliteId}/data${query ? `?${query}` : ''}`
    
    return this.request(endpoint)
  }

  // Image Upload (для ESP32-CAM симуляции)
  async uploadImage(file: File, metadata: {
    latitude: number
    longitude: number
    altitude?: number
    device_id?: string
  }): Promise<{ success: boolean; data: { id: string; analysis: any } }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('latitude', metadata.latitude.toString())
    formData.append('longitude', metadata.longitude.toString())
    formData.append('altitude', (metadata.altitude || 408000).toString())
    formData.append('device_id', metadata.device_id || 'ESP32-CAM-001')

    return this.request('/upload-image', {
      method: 'POST',
      body: formData,
      headers: {}, // Не устанавливаем Content-Type для FormData
    })
  }

  async analyzeBase64Image(data: {
    image_data: string
    latitude: number
    longitude: number
    device_id?: string
  }): Promise<{ success: boolean; analysis: any; data_id: string }> {
    return this.request('/analyze-base64', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // WebSocket connection
  createWebSocketConnection(): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws') + '/live'
    return new WebSocket(wsUrl)
  }

  // Utility methods
  async simulateESP32Capture(imageData: string, coordinates: {
    latitude: number
    longitude: number
  }): Promise<any> {
    return this.analyzeBase64Image({
      image_data: imageData,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      device_id: 'ESP32-CAM-SIMULATOR'
    })
  }

  async getRecentEvents(hours: number = 24): Promise<Event[]> {
    const response = await this.getEvents({ limit: 50 })
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return response.events.filter(event => 
      new Date(event.created_at) > cutoffTime
    )
  }

  async getEventsByType(eventType: string): Promise<Event[]> {
    const response = await this.getEvents({ event_type: eventType })
    return response.events
  }

  async getCriticalEvents(): Promise<Event[]> {
    const response = await this.getEvents({ severity: 'critical' })
    return response.events
  }
}

// Создаем единственный экземпляр API клиента
export const apiClient = new ApiClient()

// Экспортируем API клиент по умолчанию
export default apiClient
