// themes/mono/components/ProfilePage/ProfileAddressesSection.tsx
import React, { useState } from 'react';
import { UserInterface, UserAddressInterface } from '../../Interfaces/Interfaces';
import { useGetUserAddresses, useDeleteUserAddress } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import { MapPin, PlusCircle, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import AddressFormModal from './AddressFormModal'; // Importer le modal
import { useChildViewer } from '../ChildViewer/useChildViewer';

interface ProfileAddressesSectionProps {
  user: UserInterface;
}

const ProfileAddressesSection: React.FC<ProfileAddressesSectionProps> = ({ user }) => {
  const { t } = useTranslation();
  const { data: addressesResponse, isLoading, error, refetch: refetchAddresses } = useGetUserAddresses({ enabled: !!user.id });
  const addresses = addressesResponse || [];
  const { openChild } = useChildViewer()

  const [editingAddress, setEditingAddress] = useState<UserAddressInterface | null>(null);

  const deleteAddressMutation = useDeleteUserAddress();

  const handleOpenModal = (address?: UserAddressInterface) => {
    setEditingAddress(address || null);
    openChild(<AddressFormModal
          onClose={() => openChild(null)}
          initialData={editingAddress}
          userId={user.id}
          onSuccess={() => {
            refetchAddresses(); // Rafraîchir la liste après succès
            setEditingAddress(null);
          }}
        />,{
            background:'#3455',
            blur:3
        })
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm(t('profile.addresses.confirmDelete', 'Êtes-vous sûr de vouloir supprimer cette adresse ?'))) {
      deleteAddressMutation.mutate({ address_id: addressId }, {
        onSuccess: () => {
          toast.success(t('profile.addresses.deleteSuccess', 'Adresse supprimée !'));
          refetchAddresses(); // Rafraîchir la liste
        },
        onError: (err) => toast.error(err.message || t('error.generic')),
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('profile.addresses.title', 'Mes Adresses de Livraison')}</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle size={18} className="mr-1.5" /> {t('profile.addresses.add', 'Nouvelle Adresse')}
        </button>
      </div>

      {isLoading && <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin mr-2" /> {t('loading', 'Chargement...')}</div>}
      {error && <div className="text-red-500 flex items-center"><AlertTriangle size={18} className="mr-2"/>{t('error.loadData', 'Erreur de chargement des données.')}</div>}
      
      {!isLoading && !error && addresses.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-3">{t('profile.addresses.none', 'Vous n\'avez pas encore enregistré d\'adresse.')}</p>
      )}

      <div className="space-y-3">
        {addresses.map(address => (
          <div key={address.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md flex justify-between items-start hover:shadow-sm transition-shadow">
            <div className="flex-grow">
              <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
                <MapPin size={16} className="mr-2 opacity-70" /> {address.name}
              </p>
              {/* Tu devras ajouter les champs d'adresse réels ici s'ils sont dans UserAddressInterface */}
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                {t('profile.addresses.coordinates', 'Coordonnées')}: Lat {address.latitude.toFixed(4)}, Lon {address.longitude.toFixed(4)}
              </p>
              {/* <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">{address.street}, {address.city}</p> */}
            </div>
            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
              <button onClick={() => handleOpenModal(address)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title={t('edit', 'Modifier')}>
                <Edit2 size={16}/>
              </button>
              <button 
                onClick={() => handleDeleteAddress(address.id)} 
                disabled={deleteAddressMutation.isPending && deleteAddressMutation.variables?.address_id === address.id}
                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                title={t('delete', 'Supprimer')}
              >
                {(deleteAddressMutation.isPending && deleteAddressMutation.variables?.address_id === address.id)
                    ? <Loader2 className="animate-spin" size={16}/> 
                    : <Trash2 size={16}/>
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProfileAddressesSection;