// themes/mono/components/Layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link as VikeLink } from '../../renderer/Link'; // Le composant Link de Vike pour la navigation interne SPA
import { useThemeSettingsStore, ThemeSettings } from '../../api/themeSettingsStore';
import { useAuthStore } from '../../api/stores/AuthStore'; // Pour savoir si l'utilisateur est connecté
import { useCartStore } from '../../api/stores/CartStore'; // Pour le compteur du panier
import { useModalAuthStore } from '../../api/stores/ModalAuthStore'; // Pour ouvrir le modal d'auth
import { getMedia } from '../Utils/media';
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navigate } from 'vike/client/router'; // Pour la navigation programmatique
import { usePageContext } from '../../renderer/usePageContext'; // Si besoin d'infos du contexte Vike
import { useChildViewer } from '../ChildViewer/useChildViewer';
import ModalAuth from '../auth/ModalAuth';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import ModalCart from '../Cart/ModalCart';

interface HeaderProps {
  // storeInfo: Partial<StoreInterface> | null; // Si tu passes des infos du store directement
}

const Header: React.FC<HeaderProps> = (/*{ storeInfo }*/) => {
  const { t } = useTranslation();
    const {storeInfoInitial} = usePageContext()
  const headerSettings = useThemeSettingsStore(state => state.header || {});
  const generalSettings = useThemeSettingsStore(state => state.general || {});
  const storeNameFromSettings = storeInfoInitial?.name // Utiliser storeInfoInitial
  const logoFromSettings = storeInfoInitial?.logo?.[0] // Utiliser storeInfoInitial

  const { user } = useAuthStore();
  const { items: cartItems } = useCartStore(); // Supposons que ton cartStore a un champ `items`
  const {openChild} = useChildViewer()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const { urlPathname } = usePageContext(); // Pour cacher le header sur certaines routes si besoin

  // Gérer le scroll pour le header sticky
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Vérifier au montage
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [urlPathname]);

  if (!headerSettings.show) {
    return null;
  }

  const handleOpenCart = () => {
  openChild(
    <ChildViewer>
      <ModalCart />
    </ChildViewer>,
    { 
      background: generalSettings?.darkMode?.enabled ? 'rgba(10,20,30,0.6)' : 'rgba(0,0,0,0.3)', // Fond standard
      blur: 2 
    }
  );
};

  const logoUrl = logoFromSettings ? getMedia({ source: logoFromSettings, from: 'server' }) : '/assets/logo-placeholder.svg'; // Fallback
  const storeName = storeNameFromSettings || t('header.defaultStoreName', 'Ma Boutique');
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const effectiveHeaderBg = isScrolled 
    ? `${headerSettings.backgroundColor || '#FFFFFFE6'}` // ~90% opacity
    : headerSettings.backgroundColor || '#FFFFFF';

  // Cacher le header sur les pages d'authentification par exemple
  if (urlPathname.startsWith('/auth')) {
      return null;
  }
  
  return (
    <>
      <header
        ref={headerRef}
        className={`w-full font-primary transition-all duration-300 ease-out z-40
          ${isScrolled ? "fixed top-0 left-0 right-0 shadow-lg backdrop-blur-md" : "relative"}
        `}
        style={{
          backgroundColor: effectiveHeaderBg,
          color: headerSettings.textColor || generalSettings.textColor,
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          {/* Left: Mobile Menu Toggle & Logo/StoreName */}
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 -ml-2 mr-2 text-inherit"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <VikeLink href="/" className="flex items-center gap-2 group">
              {logoUrl && (
                <img src={logoUrl} alt={`${storeName} Logo`} className="h-8 sm:h-10 w-auto transition-transform group-hover:scale-105" />
              )}
              {headerSettings.showStoreName && (
                <span className="text-lg sm:text-xl font-bold text-inherit whitespace-nowrap hidden sm:block">
                  {storeName}
                </span>
              )}
            </VikeLink>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {(headerSettings.navLinks || []).map((link) => (
              <VikeLink
                key={link.href}
                href={link.href}
                className={`text-sm font-medium hover:text-[${generalSettings.primaryColor}] transition-colors`} // Utiliser la couleur primaire
              >
                {t(link.labelKey)}
              </VikeLink>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={() => navigate('/search')} // Supposons une page /search
              className="p-2 text-inherit hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" 
              aria-label={t('header.search')}
            >
              <Search size={20} />
            </button>
            <button 
              onClick={handleOpenCart} // Supposons une méthode dans le store
              className="relative p-2 text-inherit hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" 
              aria-label={t('header.cart')}
            >
              <ShoppingBag size={20} />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartItems > 9 ? '9+' : totalCartItems}
                </span>
              )}
            </button>
            <VikeLink href="/favorites" className="p-2 text-inherit hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full hidden sm:inline-flex" aria-label={t('header.favorites')}>
              <Heart size={20} />
            </VikeLink>
            <button
              onClick={() => user ? navigate('/profile') : openChild(<ModalAuth currentView={'login'}/>,{background:'#3455',blur:3})}
              className="p-2 text-inherit hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              aria-label={user ? t('header.profile') : t('header.login')}
            >
              <UserIcon size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-inherit shadow-lg py-4 px-4 sm:px-6">
            <nav className="flex flex-col space-y-3">
              {(headerSettings.navLinks || []).map((link) => (
                <VikeLink
                  key={`mobile-${link.href}`}
                  href={link.href}
                  className={`block py-2 text-sm font-medium hover:text-[${generalSettings.primaryColor}] transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(link.labelKey)}
                </VikeLink>
              ))}
              <VikeLink 
                href="/profile/favorites" 
                className={`block py-2 text-sm font-medium hover:text-[${generalSettings.primaryColor}] transition-colors sm:hidden`} // Afficher favoris en mobile aussi
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.favorites')}
              </VikeLink>
            </nav>
          </div>
        )}
      </header>
      {isScrolled && <div className="h-16 sm:h-20" />} {/* Placeholder pour compenser la hauteur du header fixe */}
    </>
  );
};

export default Header;