
// themes/mono/components/ProfilePage/PhoneFormModal.tsx
import React, { useState, useEffect } from 'react';
import { UserPhoneInterface } from '../../Interfaces/Interfaces';
import { useCreateUserPhone, useUpdateUserPhone } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface PhoneFormModalProps {
  onClose: () => void;
  userId: string;
  initialData?: UserPhoneInterface | null;
  onSuccess: () => void;
}

const PhoneFormModal: React.FC<PhoneFormModalProps> = ({  onClose, userId, initialData, onSuccess }) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [format, setFormat] = useState(''); // Ex: +225 XX XX XX XX
  const [countryCode, setCountryCode] = useState(''); // Ex: CI

  useEffect(() => {
    if (initialData) {
      setPhoneNumber(initialData.phone_number || '');
      setFormat(initialData.format || '');
      setCountryCode(initialData.country_code || '');
    } else {
      setPhoneNumber('');
      setFormat('');
      setCountryCode('');
    }
  }, [initialData]);

  const createPhoneMutation = useCreateUserPhone();
  const updatePhoneMutation = useUpdateUserPhone();
  const isSubmitting = createPhoneMutation.isPending || updatePhoneMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneData = {
      phone_number: phoneNumber,
      format: format || null, // Envoyer null si vide
      country_code: countryCode || null, // Envoyer null si vide
    };

    if (initialData?.id) {
      updatePhoneMutation.mutate(
        { phone_id: initialData.id, data: phoneData },
        {
          onSuccess: () => {
            toast.success(t('profile.phones.updateSuccess', 'Numéro mis à jour !'));
            onSuccess();
            onClose();
          },
          onError: (err) => toast.error(err.message || t('error.generic')),
        }
      );
    } else {
      createPhoneMutation.mutate(
        { data:phoneData },
        {
          onSuccess: () => {
            toast.success(t('profile.phones.createSuccess', 'Numéro ajouté !'));
            onSuccess();
            onClose();
          },
          onError: (err) => toast.error(err.message || t('error.generic')),
        }
      );
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('profile.phones.number', 'Numéro de téléphone')}
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="mt-1 input-class w-full"
            disabled={isSubmitting}
            placeholder="Ex: 0700000000"
          />
        </div>
        <div>
          <label htmlFor="phoneFormat" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('profile.phones.format', 'Format (optionnel)')}
          </label>
          <input
            type="text"
            id="phoneFormat"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="mt-1 input-class w-full"
            disabled={isSubmitting}
            placeholder="Ex: +225 0700000000"
          />
        </div>
        <div>
          <label htmlFor="countryCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('profile.phones.countryCode', 'Code pays (optionnel)')}
          </label>
          <input
            type="text"
            id="countryCode"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            className="mt-1 input-class w-full"
            disabled={isSubmitting}
            placeholder="Ex: CI, FR"
            maxLength={2} // Typiquement 2 lettres
          />
        </div>
        <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary">
            {t('cancel', 'Annuler')}
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center">
            {isSubmitting && <Loader2 className="animate-spin mr-2" size={18} />}
            {initialData ? t('saveChanges', 'Enregistrer') : t('add', 'Ajouter')}
          </button>
        </div>
      </form>
  );
};

export default PhoneFormModal;
