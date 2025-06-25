// themes/mono/pages/profile/+Page.tsx
import React, { useEffect } from 'react';
import { usePageContext, PageContextProvider } from '../../renderer/usePageContext'; // Si besoin de Layout Vike ici
import { Layout as ThemeLayout } from '../../renderer/Layout'; // Ton layout principal du thème
import { useAuthStore } from '../../api/stores/AuthStore';
import { useModalAuthStore } from '../../api/stores/ModalAuthStore'; // Pour contrôler le modal d'auth
import { ChildViewer } from '../../Components/ChildViewer/ChildViewer'; // Ajuste le chemin
import { useChildViewer } from '../../Components/ChildViewer/useChildViewer'; // Ajuste le chemin
import ModalAuth from '../../Components/auth/ModalAuth'; // Ton composant ModalAuth
import { Button } from '../../Components/UI/Button'; // Un composant Bouton stylé
import { User, LogOut, ShoppingBag, Heart, MapPin, Phone, Edit3, ShieldCheck, KeyRound } from 'lucide-react';
import { navigate } from 'vike/client/router';
import { useTranslation } from 'react-i18next';
import { useGetMe, useLogout } from '../../api/ReactSublymusApi'; // Hooks pour fetch user et logout
import { useThemeSettingsStore } from '../../api/themeSettingsStore';
import { getMedia } from '../../Components/Utils/media';
import { Link } from '../../renderer/Link';

// Composant pour une section du profil
const ProfileSection: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            {icon && <span className="mr-3 text-primary">{icon}</span>}
            {title}
        </h2>
        {children}
    </div>
);

// Composant pour un item cliquable dans une section
const ProfileLinkItem: React.FC<{ href: string; label: string; icon?: React.ReactNode }> = ({ href, label, icon }) => (
    <Link
        href={href}
        className="flex items-center py-3 px-1 text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary-dark transition-colors group"
    >
        {icon && <span className="mr-3 opacity-70 group-hover:opacity-100">{icon}</span>}
        {label}
    </Link>
);


export function Page() {
    const { t } = useTranslation();

    const { serverUrl, storeApiUrl } = usePageContext()
    const storeId = storeApiUrl.split('/')[3];
    const { user:currentUser, token, logoutGlobal } = useAuthStore();
    const { openChild } = useChildViewer();
    const logoutMutation = useLogout();
    const generalSettings = useThemeSettingsStore(state => state.general);


   
    const handleLogout = async () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => {
                logoutGlobal(); // Nettoie le store Zustand local
                navigate('/'); // Redirige vers l'accueil
                openChild(null); // Ferme tout modal de confirmation
            },
            onError: (error) => {
                console.error("Logout failed:", error);
                // Même si l'appel API échoue (ex: token déjà invalide), on déconnecte localement
                logoutGlobal();
                navigate('/');
                openChild(null);
            }
        });
    };

    const confirmLogout = () => {
        openChild(
            <ChildViewer>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">{t('profile.confirmLogoutTitle', 'Confirmation')}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{t('profile.confirmLogoutMessage', 'Êtes-vous sûr de vouloir vous déconnecter ?')}</p>
                    <div className="flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => openChild(null)}>{t('common.cancel', 'Annuler')}</Button>
                        <Button variant="danger" onClick={handleLogout} isLoading={logoutMutation.isPending}>
                            {t('profile.logout', 'Déconnexion')}
                        </Button>
                    </div>
                </div>
            </ChildViewer>,
            { background: generalSettings?.darkMode?.enabled ? 'rgba(10,20,30,0.6)' : 'rgba(255,255,255,0.6)', blur: 3 }
        );
    };

    const handleGoogleLogin = () => {
        // Le flux Google pour un client de store est initié par s_server.
        // Le thème doit rediriger vers l'URL de s_server pour le démarrage OAuth.
        // Cette URL doit contenir le store_id et les URLs de callback vers le thème.
        const currentStoreId = storeId; // Ou récupérer autrement
        const themeBaseUrl = window.location.origin; // Ex: https://mon-store.sublymus.com

        if (!currentStoreId) {
            alert(t('error.storeIdMissingForGoogleAuth', "L'identifiant du magasin est manquant pour l'authentification Google."));
            return;
        }
        if (!serverUrl) {
            alert(t('error.serverUrlMissingForGoogleAuth', "L'URL du serveur principal est manquante pour l'authentification Google."));
            return;
        }

        // Construit l'URL de redirection vers s_server
        // `s_server` redirigera ensuite vers Google
        const googleRedirectUrl = new URL(`${serverUrl}/auth/google/redirect/store`); // Endpoint sur s_server
        googleRedirectUrl.searchParams.append('store_id', currentStoreId);
        googleRedirectUrl.searchParams.append('client_success', `${themeBaseUrl}/auth/callback/google`); // Page de callback sur le thème
        googleRedirectUrl.searchParams.append('client_error', `${themeBaseUrl}/auth/login?error=google_failed`);

        window.location.href = googleRedirectUrl.toString();
    };


    if (!token || !currentUser?.id) {
        // Utilisateur non connecté
        return (
            <div className="container mx-auto px-4 py-12 sm:py-16 text-center flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <User size={64} className="mb-6 text-slate-400 dark:text-slate-500" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    {t('profile.pleaseLoginTitle', 'Accédez à Votre Espace')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
                    {t('profile.pleaseLoginMessage', 'Connectez-vous ou créez un compte pour gérer vos commandes, favoris et informations personnelles.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={() =>{
                            localStorage.setItem('auth_redirect', '/profile');
                            openChild(<ModalAuth currentView={'login'} />)
                        }}
                        style={{ backgroundColor: generalSettings?.primaryColor, color: generalSettings?.darkMode?.textColor || generalSettings?.textColor }}
                    >
                        {t('auth.loginAction', 'Se Connecter')}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={handleGoogleLogin}
                    // Style pour le bouton Google
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {t('auth.continueWithGoogle', 'Continuer avec Google')}
                    </Button>
                </div>
                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                    {t('auth.noAccountYet', 'Pas encore de compte ?')}
                    <button onClick={() => {
                        localStorage.setItem('auth_redirect', '/profile');
                        openChild(<ModalAuth currentView={'register'} />)
                    }} className="font-medium text-primary hover:underline ml-1">
                        {t('auth.createAccountLink', 'Créez-en un')}
                    </button>
                </p>
                {/* Modal d'authentification (contrôlé par ModalAuthStore) */}

            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center mb-8 sm:mb-12">
                {currentUser.photo?.[0] ? (
                    <img
                        src={getMedia({ source: currentUser.photo[0], from: 'server', host: serverUrl })}
                        alt={currentUser.full_name || 'Avatar'}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mr-0 sm:mr-6 mb-4 sm:mb-0 border-4 border-white dark:border-slate-700 shadow-lg"
                    />
                ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-4xl sm:text-5xl font-semibold mr-0 sm:mr-6 mb-4 sm:mb-0 border-4 border-white dark:border-slate-600 shadow-lg">
                        {currentUser.full_name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 text-center sm:text-left">
                        {t('profile.welcomeUser', 'Bienvenue, {{name}} !', { name: currentUser.full_name })}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-center sm:text-left">{currentUser.email}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/profile/edit')} // Supposons une page d'édition
                    className="mt-4 sm:mt-0 sm:ml-auto"
                    style={{
                        borderColor: generalSettings?.primaryColor,
                        color: generalSettings?.primaryColor
                    }}
                >
                    <Edit3 size={16} className="mr-2" />
                    {t('profile.editProfile', 'Modifier le profil')}
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Colonne de Navigation du Profil */}
                <aside className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 sm:p-6">
                        <nav className="space-y-1">
                            <ProfileLinkItem href="/profile" label={t('profile.nav.overview', 'Vue d\'ensemble')} icon={<User size={18} />} />
                            <ProfileLinkItem href="/favorites" label={t('profile.nav.favorites', 'Mes Favoris')} icon={<Heart size={18} />} />
                            <ProfileLinkItem href="/profile/orders" label={t('profile.nav.orders', 'Mes Commandes')} icon={<ShoppingBag size={18} />} />
                            <ProfileLinkItem href="/profile/addresses" label={t('profile.nav.addresses', 'Mes Adresses')} icon={<MapPin size={18} />} />
                            <ProfileLinkItem href="/profile/phones" label={t('profile.nav.phones', 'Mes Téléphones')} icon={<Phone size={18} />} />
                            <ProfileLinkItem href="/profile/security" label={t('profile.nav.security', 'Sécurité')} icon={<ShieldCheck size={18} />} />
                            <ProfileLinkItem href="/profile/change-password" label={t('profile.nav.changePassword', 'Changer Mot de Passe')} icon={<KeyRound size={18} />} />
                            {/* Déconnexion */}
                            <button
                                onClick={confirmLogout}
                                className="w-full flex items-center py-3 px-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors group mt-4"
                            >
                                <LogOut size={18} className="mr-3 opacity-70 group-hover:opacity-100" />
                                {t('profile.logout', 'Déconnexion')}
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Contenu Principal du Profil (Vue d'ensemble pour cette page) */}
                <div className="md:col-span-2">
                    <ProfileSection title={t('profile.recentActivityTitle', 'Activité Récente')} icon={<User size={22} />}>
                        {/* Ici, tu pourrais afficher un résumé des dernières commandes, etc. */}
                        <p className="text-slate-500 dark:text-slate-400">{t('profile.noRecentActivity', 'Aucune activité récente à afficher.')}</p>
                    </ProfileSection>

                    <ProfileSection title={t('profile.accountDetailsTitle', 'Détails du Compte')} icon={<Edit3 size={22} />}>
                        <div className="space-y-3 text-sm">
                            <p><strong className="text-slate-600 dark:text-slate-300">{t('profile.fullNameLabel', 'Nom complet:')}</strong> {currentUser.full_name}</p>
                            <p><strong className="text-slate-600 dark:text-slate-300">{t('profile.emailLabel', 'Email:')}</strong> {currentUser.email}</p>
                            <p><strong className="text-slate-600 dark:text-slate-300">{t('profile.phoneLabel', 'Téléphone:')}</strong> {currentUser.user_phones?.[0]?.format || t('common.notSet', 'Non défini')}</p>
                            {/* Ajouter d'autres infos si pertinent */}
                        </div>
                    </ProfileSection>
                </div>
            </div>
        </div>
    );
}

// Si tu veux que le Layout Vike soit appliqué par défaut à toutes les pages de ce dossier:
// export const Layout = ThemeLayout; // Exporte le layout du thème pour Vike