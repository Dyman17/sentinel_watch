import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Upload, Map, AlertTriangle, CheckCircle, Loader } from "lucide-react"
import { MapContainer, TileLayer, Popup, useMapEvent } from 'react-leaflet'
import L from 'leaflet'

interface AnalysisResult {
  predictions: Array<{
    label: string
    score: number
    box: any
  }>
  disaster_detections: Array<{
    label: string
    score: number
    original_label: string
  }>
  timestamp: number
}

const ThreeSourceUpload = () => {
  const [activeTab, setActiveTab] = useState('esp32')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | {
    predictions: any[]
    disaster_detections: any[]
    timestamp: number
    status: string
  } | null>({
    predictions: [],
    disaster_detections: [],
    timestamp: Date.now(),
    status: "ok"
  })
  const [error, setError] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState('/api/stream')

  // --- Вкладка 1: ESP32 Stream ---
  const handleStreamUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamUrl(e.target.value)
  }

  // --- Вкладка 2: Upload Photo ---
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setResult(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch(imageData)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('file', blob, 'upload.jpg')

      const analysisResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!analysisResponse.ok) {
        throw new Error('Ошибка анализа изображения')
      }

      const analysisResult = await analysisResponse.json()
      setResult(analysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // --- Вкладка 3: NASA GIBS Map ---
  const MapClickHandler = () => {
    useMapEvent('click', (e) => {
      const { lat, lng } = e.latlng
      console.log(`Clicked at: ${lat}, ${lng}`)
      // TODO: Fetch image from GIBS at this location
    })
    return null
  }

  const getDisasterIcon = (disasterType: string) => {
    switch (disasterType) {
      case 'fire':
        return '🔥'
      case 'flood':
        return '🌊'
      case 'earthquake':
        return '🏚️'
      case 'smoke':
        return '💨'
      case 'storm':
        return '🌪️'
      default:
        return '⚠️'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* AI Status Panel */}
      <Card className={result && result.disaster_detections && result.disaster_detections.length > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">
              {result && result.disaster_detections && result.disaster_detections.length > 0 ? "🚨" : "✅"}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                {result && result.disaster_detections && result.disaster_detections.length > 0
                  ? `🔴 Обнаружены катастрофы (${result.disaster_detections.length})`
                  : "✅ Катастрофы не обнаружены"
                }
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>🤖 Статус AI: <strong>Активен</strong></p>
                <p>📊 Объектов проанализировано: <strong>{result?.predictions?.length || 0}</strong></p>
                {result && result.disaster_detections && result.disaster_detections.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.disaster_detections.map((disaster, idx) => (
                      <p key={idx}>
                        {getDisasterIcon(disaster.label)} {disaster.label}: <strong>{(disaster.score * 100).toFixed(1)}%</strong>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <p>Обновлено:</p>
              <p className="font-mono">{new Date(result?.timestamp || Date.now()).toLocaleTimeString('ru-RU')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🎥 Три источника данных для анализа</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="esp32" className="gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">ESP32 Stream</span>
                <span className="sm:hidden">Stream</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Загрузить фото</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="gibs" className="gap-2">
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">NASA GIBS</span>
                <span className="sm:hidden">Map</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ESP32 Stream */}
            <TabsContent value="esp32" className="space-y-4">
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-3">📹 Поток с ESP32-CAM</h3>
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    URL потока (по умолчанию: /api/stream):
                  </label>
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={handleStreamUrlChange}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                    placeholder="/api/stream"
                  />
                </div>

                {streamUrl && (
                  <div className="border rounded-lg overflow-hidden bg-black">
                    <img
                      src={streamUrl}
                      alt="ESP32 Stream"
                      className="w-full h-auto object-contain max-h-96"
                      onError={() => setError('Ошибка загрузки потока')}
                    />
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  💡 Подключите реальную ESP32-CAM и измените URL потока, если необходимо.
                  Система будет автоматически анализировать кадры через YOLOv8.
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Upload Photo */}
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />

                {!selectedImage ? (
                  <div>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Загрузите изображение для анализа</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Поддерживаются форматы: JPG, PNG, GIF
                    </p>
                    <Button asChild>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        Выбрать файл
                      </label>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={selectedImage}
                        alt="Uploaded"
                        className="max-w-full max-h-96 rounded-lg mx-auto"
                      />
                    </div>

                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button
                        onClick={() => analyzeImage(selectedImage)}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Анализ...
                          </>
                        ) : (
                          'Анализировать 🤖'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null)
                          setResult(null)
                          setError(null)
                        }}
                      >
                        Другое изображение
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result && (
                <Card
                  className={
                    result.disaster_detections.length > 0
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-green-200 bg-green-50'
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.disaster_detections.length > 0 ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <span className="text-orange-600">🚨 Обнаружены катастрофы!</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-600">✅ Катастроф не обнаружено</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Статистика:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>Всего объектов: {result.predictions?.length || 0}</li>
                          <li>Катастроф найдено: {result.disaster_detections.length}</li>
                          {result.disaster_detections.length > 0 && (
                            <>
                              <li>
                                Тип: {getDisasterIcon(result.disaster_detections[0].label)}{' '}
                                {result.disaster_detections[0].label}
                              </li>
                              <li>
                                Уверенность:{' '}
                                {(result.disaster_detections[0].score * 100).toFixed(1)}%
                              </li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Найденные объекты:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {result.predictions?.map((pred, index) => (
                            <div key={index} className="text-sm flex justify-between">
                              <span>{pred.label}</span>
                              <span className="text-muted-foreground">
                                {(pred.score * 100).toFixed(1)}%
                              </span>
                            </div>
                          )) || (
                            <span className="text-sm text-muted-foreground">Нет данных</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {result.disaster_detections.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-orange-600">
                          ⚠️ Результаты отправлены в систему мониторинга SENTINEL.SAT
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 3: NASA GIBS Map */}
            <TabsContent value="gibs" className="space-y-4">
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-3">🛰️ NASA GIBS Satellite Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Выберите область на карте для анализа спутниковых снимков. Можно выбрать разные слои облачности.
                </p>

                {/* Map с NASA GIBS */}
                <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                  <MapContainer
                    center={[55.7558, 37.6173]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                  >
                    {/* OpenStreetMap base layer */}
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* NASA GIBS True Color */}
                    <TileLayer
                      url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level{z}/{z}/{y}/{x}.jpg"
                      attribution="NASA GIBS"
                      opacity={0.7}
                    />

                    <MapClickHandler />
                  </MapContainer>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-md text-sm text-amber-700">
                  🗺️ Функция выбора из карты в разработке. Пока используйте координаты для прямого анализа.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ThreeSourceUpload
