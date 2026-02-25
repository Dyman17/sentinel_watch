/**
 * 🛰️ React Query хуки для Catastrophe Watch API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import apiClient, { 
  type Event, 
  type Satellite, 
  type Statistics,
  type HealthStatus,
  type Metrics
} from '@/lib/api'

// Хук для получения здоровья системы
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    staleTime: 10000,
  })
}

// Хук для получения метрик
export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.getMetrics(),
    refetchInterval: 60000, // Обновляем каждую минуту
    staleTime: 30000,
  })
}

// Хук для получения событий
export function useEvents(params: {
  limit?: number
  severity?: string
  event_type?: string
  region?: string
} = {}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => apiClient.getEvents(params),
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    staleTime: 15000,
  })
}

// Хук для получения одного события
export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => apiClient.getEvent(id),
    enabled: !!id,
    staleTime: 60000, // Кэшируем на 1 минуту
  })
}

// Хук для получения статистики
export function useStatistics() {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => apiClient.getStatistics(),
    refetchInterval: 60000, // Обновляем каждую минуту
    staleTime: 30000,
  })
}

// Хук для получения спутников
export function useSatellites() {
  return useQuery({
    queryKey: ['satellites'],
    queryFn: () => apiClient.getSatellites(),
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    staleTime: 15000,
  })
}

// Хук для получения одного спутника
export function useSatellite(id: string) {
  return useQuery({
    queryKey: ['satellite', id],
    queryFn: () => apiClient.getSatellite(id),
    enabled: !!id,
    staleTime: 60000,
  })
}

// Хук для получения данных спутника
export function useSatelliteData(satelliteId: string, params: {
  limit?: number
  start_date?: string
  end_date?: string
} = {}) {
  return useQuery({
    queryKey: ['satellite-data', satelliteId, params],
    queryFn: () => apiClient.getSatelliteData(satelliteId, params),
    enabled: !!satelliteId,
    staleTime: 30000,
  })
}

// Мутация для загрузки изображения
export function useUploadImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      file, 
      metadata 
    }: { 
      file: File
      metadata: { latitude: number; longitude: number; altitude?: number; device_id?: string }
    }) => apiClient.uploadImage(file, metadata),
    onSuccess: (data) => {
      toast.success('Изображение успешно загружено и проанализировано')
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (error) => {
      toast.error(`Ошибка загрузки: ${error.message}`)
    },
  })
}

// Мутация для анализа base64 изображения
export function useAnalyzeBase64Image() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      image_data: string
      latitude: number
      longitude: number
      device_id?: string
    }) => apiClient.analyzeBase64Image(data),
    onSuccess: (data) => {
      toast.success('Анализ изображения завершен')
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (error) => {
      toast.error(`Ошибка анализа: ${error.message}`)
    },
  })
}

// Хук для получения последних событий
export function useRecentEvents(hours: number = 24) {
  return useQuery({
    queryKey: ['recent-events', hours],
    queryFn: () => apiClient.getRecentEvents(hours),
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

// Хук для получения событий по типу
export function useEventsByType(eventType: string) {
  return useQuery({
    queryKey: ['events-by-type', eventType],
    queryFn: () => apiClient.getEventsByType(eventType),
    enabled: !!eventType,
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

// Хук для получения критических событий
export function useCriticalEvents() {
  return useQuery({
    queryKey: ['critical-events'],
    queryFn: () => apiClient.getCriticalEvents(),
    refetchInterval: 10000, // Обновляем каждые 10 секунд для критических событий
    staleTime: 5000,
  })
}

// Хук для симуляции ESP32 (для демонстрации)
export function useSimulateESP32() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      imageData, 
      coordinates 
    }: { 
      imageData: string
      coordinates: { latitude: number; longitude: number }
    }) => apiClient.simulateESP32Capture(imageData, coordinates),
    onSuccess: (data) => {
      toast.success('ESP32 симуляция выполнена успешно')
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (error) => {
      toast.error(`Ошибка симуляции: ${error.message}`)
    },
  })
}

// WebSocket хук для реального времени
export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const ws = apiClient.createWebSocketConnection()

    ws.onopen = () => {
      setIsConnected(true)
      toast.success('WebSocket подключен')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'NEW_EVENT') {
          toast.success(`Новое событие: ${data.payload.type}`)
          
          // Инвалидируем запросы для обновления данных
          queryClient.invalidateQueries({ queryKey: ['events'] })
          queryClient.invalidateQueries({ queryKey: ['statistics'] })
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      toast.warning('WebSocket отключен')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      toast.error('Ошибка WebSocket соединения')
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [queryClient])

  return { socket, isConnected }
}
