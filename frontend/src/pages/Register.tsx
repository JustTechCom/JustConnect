// frontend/src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { registerUser, clearError } from '../store/slices/authSlice';
import { Eye, EyeOff, Mail, Lock, User, MessageCircle, Check, X } from 'lucide-react';

interface RegisterFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    // Calculate password strength
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const validateForm = (): boolean => {
    const errors: Partial<RegisterFormData> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email gerekli';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Geçerli bir email adresi girin';
    }

    // Username validation
    if (!formData.username) {
      errors.username = 'Kullanıcı adı gerekli';
    } else if (formData.username.length < 3) {
      errors.username = 'Kullanıcı adı en az 3 karakter olmalı';
    }

    // Name validation
    if (!formData.firstName) {
      errors.firstName = 'Ad gerekli';
    }
    if (!formData.lastName) {
      errors.lastName = 'Soyad gerekli';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Şifre gerekli';
    } else if (formData.password.length < 8) {
      errors.password = 'Şifre en az 8 karakter olmalı';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof RegisterFormData]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!acceptTerms) {
      alert('Kullanım şartlarını kabul etmelisiniz');
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    
    try {
      // Dispatch the registerUser thunk
      const result = await dispatch(registerUser(registerData) as any);
      
      if (registerUser.fulfilled.match(result)) {
        console.log('Registration successful!');
        // Navigation will be handled by useEffect when isAuthenticated becomes true
      } else {
        console.error('Registration failed:', result.payload);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const getPasswordStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (strength: number): string => {
    switch (strength) {
      case 0:
      case 1:
        return 'Çok Zayıf';
      case 2:
        return 'Zayıf';
      case 3:
        return 'Orta';
      case 4:
        return 'Güçlü';
      case 5:
        return 'Çok Güçlü';
      default:
        return '';
    }
  };

  const isFormValid = 
    formData.email &&
    formData.username &&
    formData.firstName &&
    formData.lastName &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    acceptTerms &&
    Object.keys(validationErrors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            JustConnect'e Katıl
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ücretsiz hesap oluştur ve arkadaşlarınla mesajlaş
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none relative block w-full px-12 py-3 border ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Email adresi"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="sr-only">
                Kullanıcı adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`appearance-none relative block w-full px-12 py-3 border ${
                    validationErrors.username ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Kullanıcı adı"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.username}</p>
              )}
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Ad"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.firstName}</p>
                )}
              </div>
              <div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Soyad"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`appearance-none relative block w-full px-12 py-3 pr-12 border ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Şifre"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
              )}
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Şifre Gücü:</span>
                    <span className={`text-sm ${passwordStrength >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Şifre Onayı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`appearance-none relative block w-full px-12 py-3 pr-12 border ${
                    validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Şifre Onayı"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.confirmPassword}</p>
              )}
              
              {/* Password match indicator */}
              {formData.confirmPassword && (
                <div className="mt-1 flex items-center space-x-2">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Şifreler eşleşiyor</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">Şifreler eşleşmiyor</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms and conditions */}
          <div className="flex items-center">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              <Link to="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Kullanım Şartları
              </Link>
              {' '}ve{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Gizlilik Politikası
              </Link>
              'nı kabul ediyorum
            </label>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isFormValid && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              } transition duration-150 ease-in-out`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Hesap Oluşturuluyor...
                </span>
              ) : (
                'Hesap Oluştur'
              )}
            </button>
          </div>

          {/* Login link */}
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zaten hesabın var mı?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Giriş Yap
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;