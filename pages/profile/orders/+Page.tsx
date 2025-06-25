// themes/mono/pages/profile/orders/+Page.tsx
import React, { useEffect } from 'react';
import { Layout as ThemeLayout } from '../../../renderer/Layout';
import { usePageContext } from '../../../renderer/usePageContext';
import { useAuthStore } from '../../../api/stores/AuthStore';
import { useGetMyOrders } from '../../../api/ReactSublymusApi';
import { navigate } from 'vike/client/router';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../Components/UI/Button';
import { Link } from '../../../renderer/Link';

// Tu auras besoin d'un composant OrderListItem ou similaire
const OrderListItem: React.FC<{ order: any }> = ({ order }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <Link href={`/profile/orders/${order.id}`} className="text-lg font-semibold text-primary hover:underline">
          {t('order.orderRef', 'Commande #{{ref}}', { ref: order.reference })}
        </Link>
        <span className={`px-2 py-1 text-xs font-medium rounded-full 
          ${order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-700 dark:text-emerald-200' 
            : order.status === 'CANCELED' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-200'}`}>
          {
            '------- lol ---------------'
        //   //@ts-ignore
        //   t(`orderStatus.${order.status?.toLowerCase()}`, order.status||'')
          }
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
        {t('order.date', 'Date : {{date, long}}', { date: new Date(order.created_at) })}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {t('order.total', 'Total : {{amount, currency}}', { amount: order.total_price, currency: order.currency })}
      </p>
      {/* Afficher quelques items ou un résumé */}
    </div>
  );
};

export function Page() {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const { data: ordersResponse, isLoading, error } = useGetMyOrders(
    { order_by: 'created_at_desc' },
    { enabled: !!token }
  );

  useEffect(() => {
    if (!token) {
      navigate('/auth/login?redirect=/profile/orders');
    }
  }, [token]);

  if (!token) return null; // Ou un loader pendant la redirection

  const renderContent = () => {
    if (isLoading) return <p className="text-center py-8">{t('loading', 'Chargement...')}</p>;
    if (error) return <p className="text-center py-8 text-red-600">{t('error.loadOrders', 'Erreur lors du chargement des commandes.')}</p>;
    if (!ordersResponse || ordersResponse.list.length === 0) {
      return <p className="text-center py-8 text-slate-500 dark:text-slate-400">{t('order.noOrders', 'Vous n\'avez aucune commande pour le moment.')}</p>;
    }
    return (
      <div>
        {ordersResponse.list.map(order => (
          <OrderListItem key={order.id} order={order} />
        ))}
        {/* Ajouter la pagination si nécessaire */}
      </div>
    );
  };

  return (
    <ThemeLayout pageContext={usePageContext()}>
      <div className="container mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center text-sm text-primary hover:underline mb-6">
          <ArrowLeft size={16} className="mr-1" />
          {t('profile.backToProfile', 'Retour au profil')}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
          <ShoppingBag size={28} className="mr-3 text-primary" />
          {t('profile.nav.orders', 'Mes Commandes')}
        </h1>
        {renderContent()}
      </div>
    </ThemeLayout>
  );
}