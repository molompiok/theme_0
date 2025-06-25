// themes/mono/components/ProductPage/ProductFaqsSection.tsx
import React, { useState } from 'react';
import { useListProductFaqs } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FaqItem: React.FC<{ faq: any }> = ({ faq }) => { // Remplace 'any' par ProductFaqInterface
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b dark:border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-left"
      >
        <span className="font-medium text-slate-800 dark:text-slate-200">{faq.title}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="pb-4 text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
          <p>{faq.content}</p>
          {faq.sources && faq.sources.length > 0 && (
            <div className="mt-2">
              <strong className="text-xs">Sources:</strong>
              <ul className="list-disc list-inside ml-1">
                {faq.sources.map((source: any, idx:number) => ( // Remplace 'any' par FaqSourceInterface
                  <li key={idx}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{source.label}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ProductFaqsSection: React.FC<{ productId: string }> = ({ productId }) => {
  const { t } = useTranslation();
  const { data: faqsResponse, isLoading } = useListProductFaqs({ product_id: productId });

  if (isLoading) return <p>{t('loading', 'Chargement...')}</p>;
  if (!faqsResponse || faqsResponse.list.length === 0) return null;

  return (
    <section id="faqs" className="py-6 border-t dark:border-slate-700">
      <h2 className="text-xl font-semibold mb-4">{t('product.faqs', 'Questions Fréquentes')}</h2>
      <div>
        {faqsResponse.list.map(faq => <FaqItem key={faq.id} faq={faq} />)}
      </div>
    </section>
  );
};
export default ProductFaqsSection;
