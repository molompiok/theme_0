// themes/mono/components/ProfilePage/ChangePasswordSection.tsx
import React, { useState } from 'react';
import { useUpdateUser } from '../../api/ReactSublymusApi'; // useUpdateUser peut aussi gérer le changement de mot de passe
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const ChangePasswordSection: React.FC = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateUserMutation = useUpdateUser(); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.password.noMatch', 'Les nouveaux mots de passe ne correspondent pas.'));
      return;
    }
    // L'API `updateUser` attend `password` et `password_confirmation`
    // Tu devras peut-être ajouter `current_password` au payload si ton API le requiert
    updateUserMutation.mutate(
      { data: { password: newPassword, password_confirmation: confirmPassword /*, current_password: currentPassword */ } },
      {
        onSuccess: () => {
          toast.success(t('profile.password.updateSuccess', 'Mot de passe mis à jour !'));
          setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        },
        onError: (err) => toast.error(err.message || t('error.generic')),
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">{t('profile.password.title', 'Changer de Mot de Passe')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ pour le mot de passe actuel si requis par l'API */}
        {/* <div> ... Current Password ... </div> */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="newPassword">{t('profile.password.new', 'Nouveau mot de passe')}</label>
          <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 input-class" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">{t('profile.password.confirm', 'Confirmer le nouveau mot de passe')}</label>
          <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 input-class" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={updateUserMutation.isPending} className="btn-primary">
            {updateUserMutation.isPending ? t('saving', 'Enregistrement...') : t('profile.password.updateButton', 'Mettre à jour')}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ChangePasswordSection;