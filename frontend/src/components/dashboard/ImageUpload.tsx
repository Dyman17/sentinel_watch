import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, AlertTriangle, CheckCircle } from "lucide-react";

interface DetectionResult {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

interface AnalysisResult {
  predictions: DetectionResult[];
  disasters_found: number;
  disaster_type?: string;
  confidence?: number;
  timestamp: number;
}

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Конвертируем base64 в blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      // Создаем FormData
      const formData = new FormData();
      formData.append('file', blob, 'upload.jpg');

      // Отправляем на наш сервер для анализа
      const analysisResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!analysisResponse.ok) {
        throw new Error('Ошибка анализа изображения');
      }

      const analysisResult = await analysisResponse.json();
      setResult(analysisResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDisasterIcon = (disasterType: string) => {
    switch (disasterType) {
      case 'fire':
        return '🔥';
      case 'flood':
        return '🌊';
      case 'earthquake':
        return '🏚️';
      case 'storm':
        return '🌪️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Анализ изображения на катастрофы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Загрузка изображения */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={analyzeImage} disabled={isAnalyzing}>
                    {isAnalyzing ? 'Анализ...' : 'Анализировать'}
                  </Button>
                  <Button variant="outline" onClick={clearImage}>
                    Другое изображение
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Результаты анализа */}
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
            <Card className={result.disasters_found > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.disasters_found > 0 ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-600">Обнаружены катастрофы!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Катастроф не обнаружено</span>
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
                      <li>Катастроф найдено: {result.disasters_found}</li>
                      {result.disaster_type && (
                        <li>Тип: {getDisasterIcon(result.disaster_type)} {result.disaster_type}</li>
                      )}
                      {result.confidence && (
                        <li>Уверенность: {(result.confidence * 100).toFixed(1)}%</li>
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
                      )) || <span className="text-sm text-muted-foreground">Нет данных</span>}
                    </div>
                  </div>
                </div>
                
                {result.disasters_found > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-orange-600">
                      ⚠️ Результаты анализа отправлены в систему мониторинга SENTINEL.SAT
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUpload;
