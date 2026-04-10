import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const city = searchParams.get('city');

    // Use OpenWeatherMap API (free tier)
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    // Check if API key is configured
    if (!API_KEY || API_KEY === 'demo_key') {
      console.log('OpenWeather API key not configured, using demo data');
      return NextResponse.json({
        success: true,
        weather: {
          location: city || 'Mumbai',
          region: 'Maharashtra',
          temperature: 28,
          description: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          icon: '02d',
          sunrise: '06:30',
          sunset: '18:45',
          pressure: 1013,
          visibility: 10,
          uvIndex: 6,
          feelsLike: 32,
          isDemo: true
        }
      });
    }

    let weatherUrl = '';

    if (lat && lon) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else if (city) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    } else {
      // Default to Mumbai if no location provided (more central for Indian users)
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Mumbai,IN&appid=${API_KEY}&units=metric`;
    }

    console.log('Fetching weather from:', weatherUrl.replace(API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenWeather API error:', response.status, errorText);
      
      // Check if it's an API key error
      if (response.status === 401) {
        console.error('Invalid OpenWeather API key - please get a valid key from https://openweathermap.org/api');
        return NextResponse.json({
          success: true,
          weather: {
            location: city || 'Mumbai',
            region: 'Maharashtra',
            temperature: 28,
            description: 'Partly Cloudy',
            humidity: 65,
            windSpeed: 12,
            icon: '02d',
            sunrise: '06:30',
            sunset: '18:45',
            pressure: 1013,
            visibility: 10,
            uvIndex: 6,
            feelsLike: 32,
            isDemo: true
          }
        });
      }
      
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Weather data received for:', data.name);
    
    // Format sunrise and sunset times
    const formatTime = (timestamp: number) => {
      return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    // Get better location name using reverse geocoding if coordinates were used
    let locationName = data.name;
    let regionName = '';
    
    if (lat && lon) {
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
        );
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          const city = geocodeData.address?.city || 
                      geocodeData.address?.town || 
                      geocodeData.address?.village || 
                      geocodeData.address?.suburb ||
                      data.name;
          const state = geocodeData.address?.state || 
                       geocodeData.address?.region || '';
          
          locationName = city;
          regionName = state;
          
          console.log('Geocoded location:', { city, state, original: data.name });
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }
    }

    const weatherData = {
      location: locationName,
      region: regionName,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      icon: data.weather[0].icon,
      sunrise: formatTime(data.sys.sunrise),
      sunset: formatTime(data.sys.sunset),
      pressure: data.main.pressure,
      visibility: Math.round(data.visibility / 1000), // Convert to km
      feelsLike: Math.round(data.main.feels_like),
      uvIndex: 6, // OpenWeather free tier doesn't include UV, so we'll use a default
      isDemo: false
    };

    return NextResponse.json({
      success: true,
      weather: weatherData
    });

  } catch (error) {
    console.error('Weather API error:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      success: true,
      weather: {
        location: 'Mumbai',
        region: 'Maharashtra',
        temperature: 28,
        description: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        icon: '02d',
        sunrise: '06:30',
        sunset: '18:45',
        pressure: 1013,
        visibility: 10,
        uvIndex: 6,
        feelsLike: 32,
        isDemo: true
      }
    });
  }
}