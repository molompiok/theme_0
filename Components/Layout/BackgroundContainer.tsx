// themes/mono/components/Layout/BackgroundContainer.tsx
import React, { useMemo, ReactNode, useEffect, useState } from 'react';
import { ThemeSettings, useThemeSettingsStore } from '../../api/themeSettingsStore'; // Ajuste le chemin
import { getMedia } from '../Utils/media'; // Ton utilitaire
import { useChildViewer } from '../ChildViewer/useChildViewer';
// import Particles, { initParticlesEngine } from "@tsparticles/react"; // Si tu utilises react-tsparticles
// import { loadSlim } from "@tsparticles/slim"; // Charger le preset slim

interface BackgroundContainerProps {
  children: React.ReactNode;
}

const BackgroundContainer: React.FC<BackgroundContainerProps> = ({ children }) => {
  const settings = useThemeSettingsStore(state => state.backgroundContainer);
  const generalSettings = useThemeSettingsStore(state => state.general);
  const themeMode = useThemeSettingsStore(state => state.general?.darkMode?.enabled ? 'dark' : 'light'); // Supposons que tu aies ce champ

  // Pour react-tsparticles
  // const [init, setInit] = useState(false);
  // useEffect(() => {
  //   if (settings?.type === 'particles') {
  //     initParticlesEngine(async (engine) => {
  //       await loadSlim(engine);
  //     }).then(() => {
  //       setInit(true);
  //     });
  //   }
  // }, [settings?.type]);
 const { blur } = useChildViewer();
  const backgroundStyle = useMemo(() => {
    const effectiveSettings = settings || {}; // Utiliser un objet vide si settings est undefined
    const styles: React.CSSProperties = {};

    // Couleur de fond par défaut si rien n'est spécifié ou si type inconnu
    styles.backgroundColor = themeMode === 'dark' 
        ? generalSettings?.darkMode?.backgroundColor || '#111827' 
        : generalSettings?.backgroundColor || '#F3F4F6';


    switch (effectiveSettings.type) {
      case 'solid':
        styles.backgroundColor = effectiveSettings.solidColor || styles.backgroundColor;
        break;
      case 'gradient':
        if (effectiveSettings.gradientColors && effectiveSettings.gradientColors.length >= 2) {
          styles.background = `linear-gradient(${effectiveSettings.gradientDirection || 'to right'}, ${effectiveSettings.gradientColors.join(', ')})`;
        }
        break;
      case 'image':
        if (effectiveSettings.imageUrl) {
          styles.backgroundImage = `url(${getMedia({ source: effectiveSettings.imageUrl, from: 'local' })})`; // 'local' si l'URL est relative au thème
          styles.backgroundSize = 'cover';
          styles.backgroundPosition = 'center';
          styles.backgroundRepeat = 'no-repeat';
          styles.opacity = effectiveSettings.imageOpacity !== undefined ? effectiveSettings.imageOpacity : 1;
        }
        break;
      case 'particles':
        // Le style de fond pour les particules est souvent géré par le composant Particles lui-même.
        // On peut mettre une couleur de fallback ici.
        styles.backgroundColor = effectiveSettings.solidColor || styles.backgroundColor; // Couleur derrière les particules
        break;
    }
    return styles;
  }, [settings, generalSettings, themeMode]);

  return (
    <div style={{...backgroundStyle, filter: blur ? `blur(${blur}px)` : 'none'}} className="main-background-container min-h-screen w-full transition-colors duration-300">
      {/* {settings?.type === 'particles' && init && (
        <Particles
          id="tsparticles"
          options={{ // Adapter ces options pour qu'elles viennent de settings.particles
            background: {
              color: { value: 'transparent' }, // Pour que le style du div parent soit visible
            },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: { enable: true, mode: 'push' },
                onHover: { enable: true, mode: 'repulse' },
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 100, duration: 0.4 },
              },
            },
            particles: {
              color: { value: settings.particles?.color || "#ffffff" },
              links: {
                color: settings.particles?.linkColor || "#ffffff",
                distance: settings.particles?.linkDistance || 150,
                enable: true,
                opacity: settings.particles?.linkOpacity || 0.5,
                width: 1,
              },
              move: {
                direction: (settings.particles?.moveDirection as any) || "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: settings.particles?.speed || 2,
                straight: false,
              },
              number: {
                density: { enable: true, value_area: settings.particles?.density ? 80000 / settings.particles.density : 800 },
                value: settings.particles?.density || 80,
              },
              opacity: { value: settings.particles?.opacity || 0.5 },
              shape: { type: (settings.particles?.shape as any) || "circle" },
              size: { value: { min: 1, max: settings.particles?.size || 5 } },
            },
            detectRetina: true,
          }}
        />
      )} */}
      {/* Le contenu sera positionné par-dessus si les particules sont en fond absolu */}
      <div className="relative z-10"> {/* Assure que le contenu est au-dessus des particules */}
        {children}
      </div>
    </div>
  );
};

export default BackgroundContainer;