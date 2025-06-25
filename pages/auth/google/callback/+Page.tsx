// themes/mono/pages/auth/callback/google/+Page.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../../api/stores/AuthStore';
import { navigate } from 'vike/client/router';
import { useGetMe } from '../../../../api/ReactSublymusApi';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout as ThemeLayout } from '../../../../renderer/Layout'; // Ton layout de thème
import { usePageContext } from '../../../../renderer/usePageContext';


export function Page() {
    const { t } = useTranslation();
    const { setToken, setUser } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const { urlParsed } = usePageContext()
    const token = urlParsed.search.token
    const expires_at = urlParsed.search.expires_at
    console.log({ token, expires_at });

    // Hook useGetMe ne sera activé qu'après avoir mis le token dans le store
    const { refetch: fetchMeData } = useGetMe({ enabled: false, backend_target: 'api' });
    
    useEffect(() => {
        const processToken = async () => {
            console.log('-------------------->>>>>>', token);

            if (token) {
                setToken(token);
                try {
                    // 1. Stocker le token temporairement pour l'appel /me
                    // AuthStore est mis à jour plus tard avec les infos user complètes
                    localStorage.setItem('jwt_token', token); // Ou le nom que tu utilises dans AuthStore
                    if (expires_at) localStorage.setItem('jwt_expires_at', expires_at);

                    // 2. Fetcher les données utilisateur avec le nouveau token
                    const meResponse = await fetchMeData(); // Déclenche le fetch

                    if (meResponse.data?.user) {
                        // 3. Mettre à jour AuthStore avec le token et les données utilisateur complètes
                        setUser(meResponse.data.user)
                        setToken(token);
                        setStatus('success');
                        // Rediriger vers le profil ou la page d'où venait l'utilisateur
                        const redirectTo = localStorage.getItem('auth_redirect') || '/profile';
                        localStorage.removeItem('auth_redirect');
                        navigate(redirectTo);
                    } else {
                        throw new Error(meResponse.error?.message || t('error.fetchUserAfterGoogle', 'Impossible de récupérer les informations utilisateur.'));
                    }
                } catch (err: any) {
                    setError(err.message || t('error.googleAuthFailed', 'L\'authentification Google a échoué.'));
                    setStatus('error');
                    localStorage.removeItem('jwt_token'); // Nettoyer le token en cas d'erreur
                    localStorage.removeItem('jwt_expires_at');
                }
            } else {
                setError(t('error.googleTokenMissing', 'Token manquant après l\'authentification Google.'));
                setStatus('error');
            }
        };

        processToken();
    }, [token, expires_at]);

    const pageContext = usePageContext(); // Pour le Layout

    let content;
    if (status === 'processing') {
        content = (
            <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg text-slate-700 dark:text-slate-200">{t('auth.processingGoogleAuth', 'Finalisation de la connexion Google...')}</p>
            </div>
        );
    } else if (status === 'error') {
        content = (
            <div className="flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-lg text-red-600 mb-2">{t('error.anErrorOccurred', 'Une erreur est survenue')}</p>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                <button onClick={() => navigate('/auth/login')}>{t('auth.backToLogin', 'Retour à la connexion')}</button>
            </div>
        );
    } else { // Success (sera redirigé)
        content = (
            <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                <p className="text-lg text-emerald-600">{t('auth.googleAuthSuccess', 'Connexion Google réussie ! Redirection...')}</p>
            </div>
        );
    }

    return (
        <ThemeLayout pageContext={pageContext}>
            <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
                {content}
            </div>
        </ThemeLayout>
    );
}