import { useEffect, useState } from 'react'
import { api, SolarTerm } from '@/api/client'
import { getSelectedCity } from '@/lib/city'
import {
  SOLAR_TERMS,
  SEASON_CONFIG,
  SEASON_MAP,
  calculateDayOfTerm,
  getSeason,
  DualRing,
} from '@/lib/term'

/**
 * 右侧边栏：城市/天气 + 双环 + 信息列表
 */
export default function RightSidebar() {
  const [solarTerm, setSolarTerm] = useState<SolarTerm | null>(null)
  const [currentTerm, setCurrentTerm] = useState('大暑')
  const [currentDay, setCurrentDay] = useState(1)
  const [season, setSeason] = useState('summer')
  const [cityName, setCityName] = useState<string | null>(null)
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  useEffect(() => {
    api.getCurrentSolarTerm()
      .then(rawData => {
        const raw: any = rawData
        const name = raw.term || raw.name || ''
        const mapped: SolarTerm = {
          name, term: name,
          solar_longitude: raw.solar_longitude || '',
          date_range: raw.date || raw.date_range || '',
          climate_pattern: raw.climate_pattern || '',
          climate: raw.climate_pattern || '',
          yinyang: raw.yinyang || '', yin_yang: raw.yinyang || '',
          tcm_organ: raw.tcm_organ || '', tcm_organ_command: raw.tcm_organ || '',
          wellness_direction: raw.wellness_direction || '',
          vulnerability_points: raw.vulnerability_points || [],
          three_pentads: raw.three_pentads || [],
          description: raw.description || '',
          season: raw.season || '',
        }
        setSolarTerm(mapped)
        setCurrentTerm(name)
        const s = getSeason(name)
        setSeason(s)
        setCurrentDay(calculateDayOfTerm(name))
      })
  }, [])

  useEffect(() => {
    const selected = getSelectedCity()
    const city = selected || '北京'
    setCityName(city)
    loadWeather(city)

    // 监听城市切换（CityPicker 修改 localStorage 后自动更新）
    const handleCityChange = () => {
      const newCity = getSelectedCity() || '北京'
      setCityName(newCity)
      loadWeather(newCity)
    }
    window.addEventListener('storage', handleCityChange)
    // 同时监听本地同步的自定义事件（同一页面内切换）
    window.addEventListener('cityChanged', handleCityChange)
    return () => {
      window.removeEventListener('storage', handleCityChange)
      window.removeEventListener('cityChanged', handleCityChange)
    }
  }, [])

  const loadWeather = async (city: string) => {
    setWeatherLoading(true)
    try {
      const w = await api.getWeather(city)
      setWeather(w)
    } catch { /* ignore */ }
    finally { setWeatherLoading(false) }
  }

  if (!solarTerm) return null

  const seasonColor = SEASON_MAP[season] || '#D4A843'

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full">
      {/* City + Weather */}
      <div className="w-full mb-4">
        {cityName ? (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-gold/30"
              style={{ fontSize: '0.8rem', color: '#F5F0E6' }}
            >
              <span style={{ color: '#D4A843' }}>●</span>
              {cityName}
            </span>
            {weatherLoading ? (
              <span className="eyebrow" style={{ color: '#C8C0B0', fontSize: '10px' }}>天气加载中...</span>
            ) : weather ? (
              <div className="flex items-center gap-2">
                <span style={{ color: '#F5F0E6', fontSize: '0.95rem', fontWeight: 600 }}>
                  {weather.temperature}
                </span>
                <span style={{ color: '#C8C0B0', fontSize: '0.75rem' }}>
                  {weather.weather} · 体感{weather.feelsLike}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Dual Ring */}
      <DualRing currentTerm={currentTerm} currentDay={currentDay} />

      {/* Info List */}
      <div className="mt-4 w-full space-y-3">
        <div className="flex justify-between items-center">
          <span className="eyebrow" style={{ color: '#C8C0B0' }}>节气</span>
          <span style={{ color: seasonColor, fontWeight: 600, fontSize: '0.85rem' }}>
            {currentTerm} · 第{currentDay}天
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="eyebrow" style={{ color: '#C8C0B0' }}>日期</span>
          <span style={{ color: '#F5F0E6', fontSize: '0.8rem' }}>{solarTerm.date_range}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="eyebrow" style={{ color: '#C8C0B0' }}>阴阳</span>
          <span style={{ color: '#F5F0E6', fontSize: '0.8rem' }}>{solarTerm.yin_yang}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="eyebrow" style={{ color: '#C8C0B0' }}>气候</span>
          <span style={{ color: '#F5F0E6', fontSize: '0.8rem' }}>{solarTerm.climate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="eyebrow" style={{ color: '#C8C0B0' }}>当令</span>
          <span style={{ color: '#F5F0E6', fontSize: '0.8rem' }}>{solarTerm.tcm_organ_command}</span>
        </div>
      </div>
    </div>
  )
}
