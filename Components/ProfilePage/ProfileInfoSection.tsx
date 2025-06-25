// themes/mono/components/ProfilePage/ProfileInfoSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { UserInterface } from '../../Interfaces/Interfaces';
import { useUpdateUser } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getMedia } from '../Utils/media';
import { usePageContext } from '../../renderer/usePageContext';
import { Camera, Edit3 } from 'lucide-react';

interface ProfileInfoSectionProps {
  user: UserInterface;
  onUpdate: () => void; // Pour rafraîchir les données "me" après mise à jour
}

const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({ user, onUpdate }) => {
  const { t } = useTranslation();
  const { serverUrl } = usePageContext();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || ''); // Email généralement non modifiable
  const [isEditing, setIsEditing] = useState(false);
  
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user.photo?.[0] ? getMedia({ source: user.photo[0] as string, from: 'server', host: serverUrl }) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setPhotoPreview(user.photo?.[0] ? getMedia({ source: user.photo[0] as string, from: 'server', host: serverUrl }) : null);
  }, [user, serverUrl]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const dataToUpdate: any = { full_name: fullName };
    if (selectedPhoto) {
      dataToUpdate.photo = [selectedPhoto]; // Le SDK s'attend à un tableau
    }
    
    updateUserMutation.mutate(
      { data: dataToUpdate },
      {
        onSuccess: () => {
          toast.success(t('profile.updateSuccess', 'Profil mis à jour !'));
          onUpdate(); // Rafraîchir les données de l'utilisateur global
          setIsEditing(false);
          setSelectedPhoto(null); // Réinitialiser la photo sélectionnée
        },
        onError: (error) => {
          toast.error(error.message || t('error.generic', 'Une erreur est survenue.'));
        },
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">{t('profile.info.title', 'Informations Personnelles')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <img
              src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || user.email || 'U')}&background=random&color=fff&size=128`}
              alt={t('profile.info.photoAlt', 'Photo de profil')}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
            />
            {isEditing && (
                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={t('profile.info.changePhoto', 'Changer de photo')}
                >
                <Camera size={24} className="text-white" />
                </button>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePhotoChange}
                disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('profile.info.fullName', 'Nom complet')}
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!isEditing || updateUserMutation.isPending}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 disabled:bg-slate-50 dark:disabled:bg-slate-700/50"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('profile.info.email', 'Email')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            disabled // Email non modifiable en général
            className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed"
          />
        </div>
        <div className="flex justify-end">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFullName(user.full_name || ''); // Reset changes
                  setSelectedPhoto(null);
                  setPhotoPreview(user.photo?.[0] ? getMedia({ source: user.photo[0] as string, from: 'server', host: serverUrl }) : null);
                }}
                disabled={updateUserMutation.isPending}
                className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                {t('cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updateUserMutation.isPending ? t('saving', 'Enregistrement...') : t('saveChanges', 'Enregistrer')}
              </button>
            </>
          ) : (
            <button
              type="submit" // Change le mode en isEditing
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit3 size={16} className="inline mr-1.5" /> {t('editProfile', 'Modifier le profil')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
export default ProfileInfoSection;