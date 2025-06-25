// components/Product/ProductDetails.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../renderer/ThemeContext';
import { MarkdownViewer } from '../MarkdownViewer/MarkdownViewer';
import { IoStar } from 'react-icons/io5';

interface ProductDetailsProps {
  name: string;
  price: number;
  description: string;
  rating: number;
  commentCount: number;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ name, price, description, rating, commentCount }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Construction dynamique des classes de couleur et de police
  const textColor = `text-${theme.palette.text_base} dark:text-white`;
  const headingFont = theme.typography.font_headings;
  const bodyFont = theme.typography.font_body;
  const accentColor = `text-${theme.palette.accent}-500`;

  return (
    <div className={`space-y-4 ${bodyFont}`}>
      <h1 className={`text-3xl md:text-4xl font-bold ${textColor} ${headingFont}`}>{name}</h1>
      
      <div className="flex items-center gap-4">
        <p className={`text-3xl font-bold text-${theme.palette.primary}-600 dark:text-${theme.palette.primary}-400`}>
          {price.toLocaleString()} FCFA
        </p>
        {rating > 0 && (
          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <IoStar className={accentColor} />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span>({commentCount} {t('product.reviews')})</span>
          </div>
        )}
      </div>

      <div className={`prose dark:prose-invert max-w-none text-${theme.palette.text_muted} dark:text-slate-300`}>
        <MarkdownViewer markdown={description} />
      </div>
    </div>
  );
};