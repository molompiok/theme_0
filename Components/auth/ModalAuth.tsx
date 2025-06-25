// themes/mono/components/Auth/ModalAuth.tsx
import React, { useState, useEffect } from 'react';
import { useModalAuthStore } from '../../api/stores/ModalAuthStore';
import { useAuthStore } from '../../api/stores/AuthStore';
import {
  useLogin,
  useRegister,
  useRequestPasswordReset,
  useResendVerificationEmail,
  // useResendVerificationEmail // Si tu l'implémentes
} from '../../api/ReactSublymusApi'; // Ajuste le chemin
import { Button } from '../UI/Button'; // Ton composant Button
import { AlertTriangle, CheckCircle, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navigate } from 'vike/client/router';
import { useThemeSettingsStore } from '../../api/themeSettingsStore'; // Pour les couleurs
import { usePageContext } from '../../renderer/usePageContext'; // Pour serverUrl
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { Input } from '../UI/Input';

const GoogleLogo = () => ( // Simple SVG pour Google
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type AuthModalView = 'login' | 'register' | 'forgot-password' | null;

const ModalAuth = ({
  currentView:currentViewInitial,
  initialEmail
}:{
  currentView: AuthModalView;
  initialEmail?: string; 
}) => {
  const { t } = useTranslation();
  const [currentView,switchToView] = useState<AuthModalView>(currentViewInitial)
  const { setToken, setUser } = useAuthStore(); // Pour mettre à jour l'état global après login
  const { openChild } = useChildViewer(); // Pour fermer le ChildViewer qui contient ce modal
  const generalSettings = useThemeSettingsStore(state => state.general);
  const { serverUrl: s_server_url, storeApiUrl } = usePageContext(); // Pour la redirection Google
const storeId = storeApiUrl.split('/')[3]
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loginMutation = useLogin({backend_target:'api'});
  const registerMutation = useRegister({backend_target:'api'});
  const forgotPasswordMutation = useRequestPasswordReset();
  const resendVerificationMutation = useResendVerificationEmail({backend_target:'api'});

  useEffect(() => {
    if (initialEmail && currentView === 'forgot-password') {
      setEmail(initialEmail);
    }
    // Reset fields when view changes
    setError(null);
    setSuccessMessage(null);
    if (currentView !== 'forgot-password') setEmail(''); // Ne pas reset si initialEmail pour forgot
    setPassword('');
    setPasswordConfirmation('');
    setFullName('');
  }, [currentView, initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (currentView === 'login') {
        const result = await loginMutation.mutateAsync({ email, password});
        setUser(result.user)
        setToken(result.token)
        closeModalAndChildViewer();
        navigate('/profile'); // Ou la page précédente
      } else if (currentView === 'register') {
        if (password !== passwordConfirmation) {
          setError(t('auth.errors.passwordsDoNotMatch', 'Les mots de passe ne correspondent pas.'));
          return;
        }
        await registerMutation.mutateAsync({ full_name: fullName, email, password, password_confirmation: passwordConfirmation });
        
        setSuccessMessage(t('auth.registerSuccessMessage', 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.'));
        // Optionnel : Basculer vers la vue de login ou afficher un message clair
        // switchToView('login');
      } else if (currentView === 'forgot-password') {
        // Le callback_url doit pointer vers la page de reset de mot de passe de ton thème.
        const resetPasswordPageUrl = `${window.location.origin}/auth/reset-password`;
        await forgotPasswordMutation.mutateAsync({ email, callback_url: resetPasswordPageUrl });
        setSuccessMessage(t('auth.forgotPasswordSuccessMessage', 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.'));
      }
    } catch (apiError: any) {
      const errorMessage = apiError.body?.message || apiError.message || t('error.generic', 'Une erreur est survenue.');
      setError(errorMessage);
      if (apiError.body?.code === 'E_EMAIL_NOT_VERIFIED') {
        // Option pour renvoyer l'email de vérification
        // setDisplayResendVerification(true);
      }
    }
  };
  
  const handleGoogleLogin = () => {
    const currentStoreId = storeId;
    const themeBaseUrl = window.location.origin;

    if (!currentStoreId) {
      setError(t('error.storeIdMissingForGoogleAuth', "L'identifiant du magasin est manquant."));
      return;
    }
    if (!s_server_url) {
      setError(t('error.serverUrlMissingForGoogleAuth', "L'URL du serveur principal est manquante."));
      return;
    }
    const googleRedirectUrl = new URL(`${s_server_url}/auth/store/google/redirect`);
    googleRedirectUrl.searchParams.append('store_id', currentStoreId);
    googleRedirectUrl.searchParams.append('client_success', `${themeBaseUrl}/auth/google/callback`);
    googleRedirectUrl.searchParams.append('client_error', `${themeBaseUrl}/auth/login?error=google_failed`);
    
    window.location.href = googleRedirectUrl.toString();
  };

  const closeModalAndChildViewer = () => {
    openChild(null); 
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || forgotPasswordMutation.isPending;

  const renderForm = () => {
    switch (currentView) {
      case 'login':
        return (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">{t('auth.loginTitle', 'Connexion')}</h2>
            <Input icon={Mail} type="email" placeholder={t('auth.emailPlaceholder', 'Adresse e-mail')} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            <div className="relative">
              <Input icon={Lock} type={showPassword ? "text" : "password"} placeholder={t('auth.passwordPlaceholder', 'Mot de passe')} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 dark:text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button type="submit" className="w-full mt-2" isLoading={isLoading} style={{ backgroundColor: generalSettings?.primaryColor }}>
              {t('auth.loginAction', 'Se Connecter')}
            </Button>
            <button type="button" onClick={() => switchToView('forgot-password')} className="mt-3 text-sm text-primary hover:underline text-center w-full">
              {t('auth.forgotPasswordLink', 'Mot de passe oublié ?')}
            </button>
          </>
        );
      case 'register':
        return (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">{t('auth.registerTitle', 'Créer un compte')}</h2>
            <Input icon={User} type="text" placeholder={t('auth.fullNamePlaceholder', 'Nom complet')} value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} />
            <Input icon={Mail} type="email" placeholder={t('auth.emailPlaceholder', 'Adresse e-mail')} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
             <div className="relative">
              <Input icon={Lock} type={showPassword ? "text" : "password"} placeholder={t('auth.passwordPlaceholder', 'Mot de passe')} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 dark:text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input icon={Lock} type={showPassword ? "text" : "password"} placeholder={t('auth.confirmPasswordPlaceholder', 'Confirmer le mot de passe')} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required disabled={isLoading} />
            <Button type="submit" className="w-full mt-2" isLoading={isLoading} style={{ backgroundColor: generalSettings?.primaryColor }}>
              {t('auth.registerAction', 'S\'inscrire')}
            </Button>
          </>
        );
      case 'forgot-password':
        return (
          <>
            <button onClick={() => switchToView('login')} className="absolute top-4 left-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">{t('auth.forgotPasswordTitle', 'Réinitialiser le mot de passe')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 text-center">{t('auth.forgotPasswordInstruction', 'Entrez votre email pour recevoir un lien de réinitialisation.')}</p>
            <Input icon={Mail} type="email" placeholder={t('auth.emailPlaceholder', 'Adresse e-mail')} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            <Button type="submit" className="w-full mt-2" isLoading={isLoading} style={{ backgroundColor: generalSettings?.primaryColor }}>
              {t('auth.sendResetLinkAction', 'Envoyer le lien')}
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  if (!currentView) return null; // Ne rien rendre si pas de vue active (ou le ChildViewer est fermé)

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative">
      <button onClick={closeModalAndChildViewer} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
        <X size={20} />
      </button>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center">
          <AlertTriangle size={18} className="mr-2" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 rounded-md text-sm flex items-center">
          <CheckCircle size={18} className="mr-2" /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {renderForm()}
      </form>

      {currentView !== 'forgot-password' && (
        <>
          <div className="my-6 flex items-center">
            <hr className="flex-grow border-slate-200 dark:border-slate-700" />
            <span className="mx-4 text-xs text-slate-500 dark:text-slate-400 uppercase">{t('auth.orConnector', 'OU')}</span>
            <hr className="flex-grow border-slate-200 dark:border-slate-700" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            <GoogleLogo /> {t('auth.continueWithGoogle', 'Continuer avec Google')}
          </Button>
        </>
      )}

      <div className="mt-6 text-center text-sm">
        {currentView === 'login' && (
          <p className="text-slate-600 dark:text-slate-300">
            {t('auth.noAccountYet', 'Pas encore de compte ?')}{' '}
            <button onClick={() => switchToView('register')} className="font-medium text-primary hover:underline">
              {t('auth.createAccountLink', 'Créez-en un')}
            </button>
          </p>
        )}
        {currentView === 'register' && (
          <p className="text-slate-600 dark:text-slate-300">
            {t('auth.alreadyHaveAccount', 'Déjà un compte ?')}{' '}
            <button onClick={() => switchToView('login')} className="font-medium text-primary hover:underline">
              {t('auth.loginLink', 'Connectez-vous')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default ModalAuth;