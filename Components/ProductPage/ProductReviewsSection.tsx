// themes/mono/components/ProductPage/ProductReviewsSection.tsx
import React, { useState } from 'react';
import { useGetComments } from '../../api/ReactSublymusApi'; // Ajuste le chemin
import { CommentInterface } from '../../Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import { RatingStars } from '../Product/FeaturedProductDisplay'; // Réutiliser RatingStars
import { getMedia } from '../Utils/media';
import { usePageContext } from '../../renderer/usePageContext';

const ReviewItem: React.FC<{ review: CommentInterface }> = ({ review }) => {
  const { serverUrl } = usePageContext();
  const {t} = useTranslation()
  return (
    <div className="py-4 border-b dark:border-slate-700">
      <div className="flex items-center mb-2">
        <img 
          src={getMedia({source: review.user?.photo?.[0] as string, from: 'server', host: serverUrl})}
          alt={review.user?.full_name || 'Utilisateur'} 
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{review.user?.full_name || t('anonymous')}</p>
          <RatingStars rating={review.rating} showCount={false} />
        </div>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      <h5 className="font-medium text-md mb-1 text-slate-700 dark:text-slate-300">{review.title}</h5>
      <p className="text-sm text-slate-600 dark:text-slate-400">{review.description}</p>
      {/* Afficher les images de l'avis si présentes */}
    </div>
  )
}

const ProductReviewsSection: React.FC<{ productId: string }> = ({ productId }) => {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(3); // Afficher 3 avis initialement
  const { data: commentsResponse, isLoading } = useGetComments( // Supposons que useGetComments supporte la pagination infinie ou par page
    { product_id: productId, order_by: 'created_at_desc', limit: limit, with_users: true },
    // Adapte les options si ton hook fonctionne différemment pour la pagination
  );

  const reviews = commentsResponse?.list || [];
  const totalReviews = commentsResponse?.meta?.total || 0;

  if (isLoading && reviews.length === 0) return <p>{t('loadingReviews', 'Chargement des avis...')}</p>;
  if (!isLoading && reviews.length === 0) {
    return (
      <section id="reviews" className="py-6 border-t dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4">{t('product.reviewsAndRatings', 'Avis et Notes')}</h2>
        <p>{t('product.noReviewsYet', 'Aucun avis pour ce produit pour le moment.')}</p>
         {/* Bouton pour laisser un avis (si user connecté et a acheté) */}
      </section>
    );
  }
  
  const handleShowMore = () => {
    setLimit(prev => prev + 5); // Charger 5 de plus
    // Si ton hook useGetComments utilise fetchNextPage pour la pagination infinie :
    // if (hasNextPage) {
    //   fetchNextPage();
    // }
  };

  return (
    <section id="reviews" className="py-6 border-t dark:border-slate-700">
      <h2 className="text-xl font-semibold mb-4">{t('product.reviewsAndRatings', 'Avis et Notes')}</h2>
      <div className="space-y-4">
        {reviews.map(review => <ReviewItem key={review.id} review={review} />)}
      </div>
      {reviews.length < totalReviews && ( // Ou utiliser hasNextPage
        <div className="mt-6 text-center">
          <button
            onClick={handleShowMore}
            disabled={!!commentsResponse?.meta.next_page_url}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {!!commentsResponse?.meta.next_page_url
              ? t('loadingMoreReviews', 'Chargement...') 
              : t('product.showMoreReviews', 'Afficher plus d\'avis ({{count}} restants)', { count: totalReviews - reviews.length })
            }
          </button>
        </div>
      )}
      {/* Bouton pour laisser un avis (si user connecté et a acheté) */}
    </section>
  );
};
export default ProductReviewsSection;
