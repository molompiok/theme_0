// themes/mono/components/ProfilePage/ProfilePhonesSection.tsx
import React, { useState } from 'react';
import { UserInterface, UserPhoneInterface } from '../../Interfaces/Interfaces';
import { useGetUserPhones, useDeleteUserPhone } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import { Phone, PlusCircle, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneFormModal from './PhoneFormModal'; // Importer le modal
import { useChildViewer } from '../ChildViewer/useChildViewer';

interface ProfilePhonesSectionProps {
    user: UserInterface;
}

const ProfilePhonesSection: React.FC<ProfilePhonesSectionProps> = ({ user }) => {
    const { t } = useTranslation();
    const { data: phonesResponse, isLoading, error, refetch: refetchPhones } = useGetUserPhones({ enabled: !!user.id });
    const phones = phonesResponse || [];

    const {openChild} = useChildViewer()
    const [editingPhone, setEditingPhone] = useState<UserPhoneInterface | null>(null);

    const deletePhoneMutation = useDeleteUserPhone();

    const handleOpenModal = (phone?: UserPhoneInterface) => {
        setEditingPhone(phone || null);
        openChild(<PhoneFormModal
            onClose={() => { 
                openChild(null);
            }}
            initialData={editingPhone}
            userId={user.id}
            onSuccess={() => {
                refetchPhones();
                openChild(null);
            }}
        />,{
            background:'#3455',
            blur:3,
        })
    };

    const handleDeletePhone = (phoneId: string) => {
        if (window.confirm(t('profile.phones.confirmDelete', 'Êtes-vous sûr de vouloir supprimer ce numéro ?'))) {
            deletePhoneMutation.mutate({ phone_id: phoneId }, {
                onSuccess: () => {
                    toast.success(t('profile.phones.deleteSuccess', 'Numéro supprimé !'));
                    refetchPhones();
                },
                onError: (err) => toast.error(err.message || t('error.generic'))
            });
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-md rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('profile.phones.title', 'Mes Numéros de Téléphone')}</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusCircle size={18} className="mr-1.5" /> {t('profile.phones.add', 'Nouveau Numéro')}
                </button>
            </div>

            {isLoading && <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin mr-2" /> {t('loading', 'Chargement...')}</div>}
            {error && <div className="text-red-500 flex items-center"><AlertTriangle size={18} className="mr-2" />{t('error.loadData', 'Erreur de chargement des données.')}</div>}

            {!isLoading && !error && phones.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-3">{t('profile.phones.none', 'Aucun numéro de téléphone enregistré.')}</p>
            )}

            <div className="space-y-3">
                {phones.map(phone => (
                    <div key={phone.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md flex justify-between items-center hover:shadow-sm transition-shadow">
                        <div className="flex-grow">
                            <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
                                <Phone size={16} className="mr-2 opacity-70" />
                                {phone.format || phone.phone_number}
                                {phone.country_code && <span className="ml-2 text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{phone.country_code.toUpperCase()}</span>}
                            </p>
                        </div>
                        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                            <button onClick={() => handleOpenModal(phone)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title={t('edit', 'Modifier')}>
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeletePhone(phone.id)}
                                disabled={deletePhoneMutation.isPending && deletePhoneMutation.variables?.phone_id === phone.id}
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                title={t('delete', 'Supprimer')}
                            >
                                {(deletePhoneMutation.isPending && deletePhoneMutation.variables?.phone_id === phone.id)
                                    ? <Loader2 className="animate-spin" size={16} />
                                    : <Trash2 size={16} />
                                }
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default ProfilePhonesSection;