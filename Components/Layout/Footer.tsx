// themes/mono/components/Layout/Footer.tsx
import React from 'react';
import { useThemeSettingsStore, ThemeSettings } from '../../api/themeSettingsStore';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Twitter, Youtube, MessageCircle } from 'lucide-react'; // Ajouté Youtube et MessageCircle pour le contact
import { getMedia } from '../Utils/media'; // Si logo dans footer
import { usePageContext } from '../../renderer/usePageContext';
import { Link } from '../../renderer/Link';

interface FooterProps {
  // Si tu passes des settings spécifiques, sinon il lira depuis le store
  // settings?: ThemeSettings['footer'];
}

const socialIconMap = {
  facebook: <Facebook size={20} />,
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  youtube: <Youtube size={20} />, // Ajouté
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.79-1.62.19-.34.31-.7.36-1.07.07-.9.07-1.8.05-2.71-.02-1.3-.04-2.6-.04-3.88-.01-1.55.01-3.1-.02-4.65-.08-1.4-.54-2.79-1.35-3.94-1.31-1.92-3.58-3.17-5.91-3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96ZM6.03 15.05c.03.46.19.9.44 1.3.3.46.7.84 1.19 1.12.68.41 1.5.58 2.31.47.66-.06 1.3-.34 1.84-.79.46-.39.83-.89 1.07-1.46.25-.58.34-1.25.26-1.92-.09-.83-.47-1.61-1.09-2.17-.61-.55-1.37-.86-2.2-.84-.81.04-1.6.36-2.16.93-.58.59-.92 1.34-.99 2.16Z"></path></svg>, // Icône TikTok SVG simple
  contact: <MessageCircle size={20} />, // Pour un lien de contact général
};


const Footer: React.FC<FooterProps> = () => {
  const { t } = useTranslation();
  const {storeInfoInitial} = usePageContext()
  const settings = useThemeSettingsStore(state => state.footer || {});
  const generalSettings = useThemeSettingsStore(state => state.general || {});
  const storeNameFromSettings = storeInfoInitial?.name;
  const storeLogoFromSettings = storeInfoInitial?.logo?.[0];

  if (!settings.show) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const storeName = storeNameFromSettings || t('footer.defaultStoreName', 'Votre Boutique');
  const logoUrl = storeLogoFromSettings ? getMedia({ source: storeLogoFromSettings, from: 'server' }) : null;


  return (
    <footer
      className="text-sm py-8 sm:py-12"
      style={{
        backgroundColor: settings.backgroundColor || generalSettings.darkMode?.backgroundColor,
        color: settings.textColor || generalSettings.darkMode?.textColor,
        fontFamily: settings.font || generalSettings.bodyFont,
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-8 ${settings.layout === 'multi-column' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 text-center'}`}>
          {/* Section Logo/Nom et Description */}
          {(settings.layout === 'multi-column' || (settings.sections && settings.sections.length === 0)) && (
             <div className="mb-6 md:mb-0">
              {logoUrl && (
                <Link href="/" className="inline-block mb-3">
                  <img src={logoUrl} alt={`${storeName} Logo`} className="h-10 w-auto" />
                </Link>
              )}
              <h4 className="text-lg font-semibold mb-2" style={{ color: generalSettings.primaryColor }}>
                {storeName}
              </h4>
              {settings.sections?.[0]?.contentKey && (
                <p className="text-xs opacity-80">
                  {t(settings.sections[0].contentKey)}
                </p>
              )}
            </div>
          )}

          {/* Sections de liens dynamiques */}
          {settings.sections?.map((section, index) => {
             // Ne pas rendre la première section si elle est déjà gérée par le logo/description ci-dessus
             if (settings.layout === 'multi-column' && index === 0 && settings.sections?.[0]?.contentKey) {
               return null;
             }
            return(
            <div key={section.titleKey} className="mb-6 md:mb-0">
              <h5 className="font-semibold mb-3 uppercase tracking-wider text-sm" style={{ color: generalSettings.primaryColor }}>
                {t(section.titleKey)}
              </h5>
              {section.links && section.links.length > 0 && (
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:underline opacity-80 hover:opacity-100 transition-opacity">
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {/* Si la section a du contenu mais pas de liens (après la première section spéciale) */}
              {section.contentKey && (!section.links || section.links.length === 0) && !(settings.layout === 'multi-column' && index === 0) && (
                 <p className="text-xs opacity-80">{t(section.contentKey)}</p>
              )}
            </div>
          )})}
        </div>

        {/* Icônes Sociales et Copyright */}
        <div className="mt-8 pt-8 border-t text-center flex flex-col sm:flex-row justify-between items-center gap-4"
             style={{ borderColor: `${settings.textColor || generalSettings.textColor}20` /* 20% opacity */}}>
          
          {settings.showSocialIcons && settings.socialLinks && settings.socialLinks.length > 0 && (
            <div className="flex space-x-4">
              {settings.socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: settings.textColor || generalSettings.textColor }}
                >
                  {socialIconMap[social.platform] || social.platform}
                </a>
              ))}
            </div>
          )}

          <p className="text-xs opacity-70">
            {t(settings.copyrightTextKey || 'footer.copyright', { year: currentYear, storeName })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;