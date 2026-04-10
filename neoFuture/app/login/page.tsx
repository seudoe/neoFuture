'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Sprout, Wheat, ShoppingCart, Eye, EyeOff, CloudSun, Leaf, Store, ChevronRight, Wind, Droplets, Thermometer } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'farmer' | 'buyer'>('farmer');
  const [formData, setFormData] = useState({
    name: '',
    identifier: '', // email or phone
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'farmer') {
        router.replace('/dashboard/farmer');
      } else {
        router.replace('/dashboard/buyer');
      }
    }
  }, []);

  // Fetch weather data on component mount
  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      const response = await fetch('/api/weather');
      const data = await response.json();
      
      if (data.success) {
        setWeather(data.weather);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Mock weather data as fallback
  const weatherData = weather || {
    temperature: 24,
    description: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    location: 'Regional Market'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role === 'farmer') {
            router.push('/dashboard/farmer');
          } else {
            router.push('/dashboard/buyer');
          }
        } else {
          setError(data.error || t('auth.loginFailed'));
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.passwordsDoNotMatch'));
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.identifier,
            phone_number: formData.phone_number,
            password: formData.password,
            role: userType
          })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role === 'farmer') {
            router.push('/dashboard/farmer');
          } else {
            router.push('/dashboard/buyer');
          }
        } else {
          setError(data.error || t('auth.registrationFailed'));
        }
      }
    } catch (error) {
      setError(t('auth.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const themeColor = userType === 'farmer' ? 'green' : 'blue';
  const bgColor = userType === 'farmer' ? 'bg-green-50' : 'bg-blue-50';
  const gradientColor = userType === 'farmer' ? 'from-green-600 to-emerald-800' : 'from-blue-600 to-indigo-800';
  const buttonColor = userType === 'farmer' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className={`min-h-screen flex flex-col ${bgColor} font-sans transition-colors duration-500`}>
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradientColor} text-white shadow-lg`}>
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                {t('auth.appTitle')}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
          
          {/* Mobile Navigation */}
          <div className="sm:hidden py-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradientColor} text-white shadow-lg`}>
                  <Sprout className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  {t('auth.appTitle')}
                </span>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto min-h-0">
        
        {/* Left Side - Hero Content & Weather */}
        <div className="lg:w-3/5 p-4 sm:p-6 lg:p-12 lg:pl-13 xl:pl-20 flex flex-col justify-center relative">
             {/* Decorative Background Elements */}
            <div className={`absolute top-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-${themeColor}-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000`}></div>
            <div className={`absolute -bottom-8 left-10 sm:left-20 w-32 h-32 sm:w-64 sm:h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000`}></div>

            <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${userType === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} mb-4 sm:mb-6 shadow-sm border border-${themeColor}-200`}>
                    <span className="flex h-2 w-2 rounded-full bg-current mr-2 animate-pulse"></span>
                    <span className="text-xs font-semibold tracking-wide uppercase">
                      {userType === 'farmer' ? t('auth.empoweringFarmers') : t('auth.connectingBuyers')}
                    </span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
                    {t('auth.grow')}. <br/>
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientColor}`}>
                        {t('auth.connect')}.
                    </span> <br/>
                    {t('auth.thrive')}.
                </h1>
                
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                    {t('auth.appSubtitle')}
                    {userType === 'farmer' 
                        ? ` ${t('auth.listProduce')}`
                        : ` ${t('auth.accessFresh')}`}
                </p>

                {/* Weather Widget */}
                <div className="bg-white/60 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 text-gray-700">
                            <CloudSun className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-sm">{t('weather.liveConditions')}</span>
                        </div>
                        {weather && weather.location && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md hidden sm:inline">
                            {weather.location}
                            {weather.region && weather.region !== weather.location && (
                              <span className="text-gray-400"> • {weather.region}</span>
                            )}
                          </span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                             <Thermometer className="w-5 h-5 mx-auto mb-1 text-red-500" />
                             <div className="text-base font-bold text-gray-900">
                               {weatherLoading ? '...' : `${weatherData.temperature}°C`}
                             </div>
                             <div className="text-[10px] text-gray-500">{t('weather.temp')}</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                             <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                             <div className="text-base font-bold text-gray-900">
                               {weatherLoading ? '...' : `${weatherData.humidity}%`}
                             </div>
                             <div className="text-[10px] text-gray-500">{t('weather.humidity')}</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                             <Wind className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                             <div className="text-base font-bold text-gray-900">
                               {weatherLoading ? '...' : `${weatherData.windSpeed} km/h`}
                             </div>
                             <div className="text-[10px] text-gray-500">{t('weather.wind')}</div>
                        </div>
                    </div>
                    {weather && weather.isDemo && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        * {t('weather.demoData')}
                      </p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-20/30 flex items-center justify-center p-4 sm:p-6 lg:p-9 lg:pr-16 xl:pr-24 bg-white/50 relative">
             <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 relative z-20 border border-gray-100">
                {/* Login/Register Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 ${
                      isLogin 
                      ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' 
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{t('auth.login')}</span>
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 ${
                      !isLogin 
                      ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' 
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{t('auth.register')}</span>
                  </button>
                </div>

                {/* Role Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                    <button
                        onClick={() => setUserType('farmer')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 ${
                            userType === 'farmer' 
                            ? 'bg-white text-green-700 shadow-md transform scale-[1.02]' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Wheat className="w-4 h-4" />
                        <span className="text-sm">{t('auth.farmer')}</span>
                    </button>
                    <button
                        onClick={() => setUserType('buyer')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 ${
                            userType === 'buyer' 
                            ? 'bg-white text-blue-700 shadow-md transform scale-[1.02]' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">{t('auth.buyer')}</span>
                    </button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isLogin ? t('auth.enterCredentials') : t('auth.joinCommunity')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {!isLogin && (
                        <div className="group">
                             <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">{t('auth.fullName')}</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:bg-white outline-none transition-all duration-200 text-sm ${userType === 'farmer' ? 'focus:ring-green-500' : 'focus:ring-blue-500'}`}
                                placeholder={t('auth.fullName')}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 ml-1">
                          {isLogin ? t('auth.emailOrPhone') : t('auth.email')}
                        </label>
                        <div className="relative">
                            <input
                                type={isLogin ? "text" : "email"}
                                name="identifier"
                                value={formData.identifier}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 focus:bg-white outline-none transition-all duration-200 text-sm`}
                                placeholder={isLogin ? t('auth.email') : t('auth.email')}
                                required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                         <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 ml-1">{t('auth.phoneNumber')}</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 focus:bg-white outline-none transition-all duration-200 text-sm`}
                                placeholder={t('auth.phoneNumber')}
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 ml-1">{t('auth.password')}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 focus:bg-white outline-none transition-all duration-200 pr-10 text-sm`}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                     {!isLogin && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 ml-1">{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 focus:bg-white outline-none transition-all duration-200 text-sm`}
                                placeholder="••••••••"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-shake">
                            <p className="text-red-700 text-xs font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 mt-4 rounded-xl font-bold text-white shadow-lg shadow-${themeColor}-200 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 ${buttonColor} flex items-center justify-center space-x-2 text-sm`}
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>{isLogin ? t('auth.login') : t('auth.register')}</span>
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-600">
                        {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className={`ml-2 font-bold text-${themeColor}-600 hover:text-${themeColor}-700 underline decoration-2 underline-offset-4 transition-all`}
                        >
                            {isLogin ? t('auth.registerNow') : t('auth.loginHere')}
                        </button>
                    </p>
                </div>

                {/* Demo Note - Styled */}
                <div className="mt-6 pt-4 border-t border-gray-100 text-center hidden">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{t('auth.demoCredentials')}</p>
                    <div className="flex flex-col space-y-1 text-[10px] text-gray-500">
                        <span>{t('auth.farmer')}: <span className="font-mono bg-gray-100 px-1 rounded">rajesh.farmer@agribridge.com</span> / <span className="font-mono bg-gray-100 px-1 rounded">farmer123</span></span>
                        <span>{t('auth.buyer')}: <span className="font-mono bg-gray-100 px-1 rounded">amit.buyer@agribridge.com</span> / <span className="font-mono bg-gray-100 px-1 rounded">buyer123</span></span>
                    </div>
                </div>

             </div>
        </div>

      </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <div className="flex justify-center items-center space-x-2 mb-4 text-gray-400">
                     <Sprout className="w-5 h-5" />
                     <span className="font-semibold">{t('auth.appTitle')}</span>
                </div>
                <p className="text-sm text-gray-500">© 2026 {t('auth.appTitle')}. {t('auth.allRightsReserved')}.</p>
            </div>
        </footer>
    </div>
  );
}