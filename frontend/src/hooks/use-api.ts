/**
 * 🛰️ React Query хуки для SENTINEL.SAT API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import apiClient, { 
  type HealthStatus,
  type LatestLog,
  type AnalysisResult
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

// Хук для получения последних логов
export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: () => apiClient.getLogs(),
    refetchInterval: 5000, // Обновляем каждые 5 секунд
    staleTime: 2000,
  })
}

// Хук для получения последнего результата
export function useLatest() {
  return useQuery({
    queryKey: ['latest'],
    queryFn: () => apiClient.getLatest(),
    refetchInterval: 3000, // Обновляем каждые 3 секунды
    staleTime: 1000,
  })
}

// Хук для получения истории детекций
export function useDetections() {
  return useQuery({
    queryKey: ['detections'],
    queryFn: () => apiClient.getDetections(),
    refetchInterval: 10000, // Обновляем каждые 10 секунд
    staleTime: 5000,
  })
}

// Мутация для загрузки изображения
export function useUploadImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => apiClient.uploadImage(file),
    onSuccess: (data) => {
      toast.success('Изображение успешно загружено и проанализировано')
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['latest'] })
      queryClient.invalidateQueries({ queryKey: ['detections'] })
    },
    onError: (error) => {
      toast.error(`Ошибка загрузки: ${error.message}`)
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
        
        // Обновляем данные при получении нового лога
        if (data.disasters_found !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['logs'] })
          queryClient.invalidateQueries({ queryKey: ['latest'] })
          queryClient.invalidateQueries({ queryKey: ['detections'] })
          
          if (data.disasters_found > 0) {
            toast.warning(`Обнаружена катастрофа: ${data.disaster_type || 'Unknown'}`)
          }
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
