// themes/mono/components/ProfilePage/AddressFormModal.tsx
import React, { useState, useEffect } from 'react';
import { UserAddressInterface } from '../../Interfaces/Interfaces';
import { useCreateUserAddress, useUpdateUserAddress } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddressFormModalProps {
  onClose: () => void;
  userId: string; // L'ID de l'utilisateur actuel
  initialData?: UserAddressInterface | null; // Pour la modification
  onSuccess: () => void; // Pour rafraîchir la liste après succès
}

const AddressFormModal: React.FC<AddressFormModalProps> = ({ onClose, userId, initialData, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [longitude, setLongitude] = useState<number | ''>(''); // Permettre la chaîne vide initialement
  const [latitude, setLatitude] = useState<number | ''>('');
  // Tu ajouteras d'autres champs ici si ton UserAddressInterface est plus riche (rue, ville, etc.)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setLongitude(initialData.longitude ?? '');
      setLatitude(initialData.latitude ?? '');
    } else {
      // Réinitialiser pour une nouvelle adresse
      setName('');
      setLongitude('');
      setLatitude('');
    }
  }, [initialData]); // Réinitialiser quand le modal s'ouvre ou que initialData change

  const createAddressMutation = useCreateUserAddress();
  const updateAddressMutation = useUpdateUserAddress();

  const isSubmitting = createAddressMutation.isPending || updateAddressMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (longitude === '' || latitude === '') {
        toast.error(t('profile.addresses.coordsRequired', 'Les coordonnées sont requises.'));
        return;
    }

    const addressData = {
      name,
      longitude: Number(longitude),
      latitude: Number(latitude),
      // ... autres champs
    };

    if (initialData?.id) { // Mode mise à jour
      updateAddressMutation.mutate(
        { address_id: initialData.id, data: addressData },
        {
          onSuccess: () => {
            toast.success(t('profile.addresses.updateSuccess', 'Adresse mise à jour !'));
            onSuccess();
            onClose();
          },
          onError: (err) => toast.error(err.message || t('error.generic')),
        }
      );
    } else { // Mode création
      createAddressMutation.mutate(
        { data: addressData }, // user_id n'est pas dans Omit, mais createAddress attend `data` sans
        {
          onSuccess: () => {
            toast.success(t('profile.addresses.createSuccess', 'Adresse ajoutée !'));
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
          <label htmlFor="addressName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('profile.addresses.labelName', 'Nom de l\'adresse (ex: Maison, Bureau)')}
          </label>
          <input
            type="text"
            id="addressName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 input-class w-full" // Remplace par ta classe de style pour les inputs
            disabled={isSubmitting}
          />
        </div>
        
        {/* TODO: Remplacer par un sélecteur de carte pour lat/lon ou des champs pour l'adresse complète */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.addresses.latitude', 'Latitude')}
            </label>
            <input
                type="number"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                required
                step="any"
                className="mt-1 input-class w-full"
                disabled={isSubmitting}
            />
            </div>
            <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.addresses.longitude', 'Longitude')}
            </label>
            <input
                type="number"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                required
                step="any"
                className="mt-1 input-class w-full"
                disabled={isSubmitting}
            />
            </div>
        </div>
        {/* Ajouter d'autres champs ici: rue, ville, code postal, pays etc. */}
        {/* Exemple:
        <div>
          <label htmlFor="street">Rue</label>
          <input type="text" id="street" ... />
        </div>
        */}

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            {t('cancel', 'Annuler')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex items-center"
          >
            {isSubmitting && <Loader2 className="animate-spin mr-2" size={18} />}
            {initialData ? t('saveChanges', 'Enregistrer') : t('add', 'Ajouter')}
          </button>
        </div>
      </form>
  );
};

export default AddressFormModal;