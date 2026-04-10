'use client';

import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { ShoppingCart, ImageIcon, Search, X, ArrowUpDown, Sparkles, TrendingDown, Clock, ChevronDown, Info } from 'lucide-react';
import { useDashboardData, useProducts, useCart } from '@/lib/hooks/useDashboardData';
import ProductDetails from '@/components/ProductDetails';

type SortMode = 'recommended' | 'price_asc' | 'price_desc' | 'newest';

const SORT_OPTIONS: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'recommended', label: 'Recommended',       icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: 'price_asc',   label: 'Price: Low → High', icon: <TrendingDown className="w-3.5 h-3.5" /> },
  { value: 'price_desc',  label: 'Price: High → Low', icon: <TrendingDown className="w-3.5 h-3.5 rotate-180" /> },
  { value: 'newest',      label: 'Newest First',      icon: <Clock className="w-3.5 h-3.5" /> },
];

export default function BrowseProductsPage() {
  const { t } = useI18n();
  const { user } = useDashboardData('buyer');
  const { products, loading } = useProducts();
  const { addToCart } = useCart(user?.id);

  const [searchTerm, setSearchTerm]   = useState('');
  const [sortMode, setSortMode]       = useState<SortMode>('recommended');
  const [sortOpen, setSortOpen]       = useState(false);
  const [selectedProduct, setSelectedProduct]     = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedQuantity, setSelectedQuantity]   = useState<Record<number, number>>({});

  const [scoreMap, setScoreMap]       = useState<Record<number, number>>({});
  const [reasonMap, setReasonMap]     = useState<Record<number, string[]>>({});
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [hasHistory, setHasHistory]   = useState(false);
  const [showDebug, setShowDebug]     = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/recommendations?buyer_id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.products) {
          const sm: Record<number, number> = {};
          const rm: Record<number, string[]> = {};
          for (const p of data.products) {
            sm[p.id] = p.rec_score ?? 0;
            rm[p.id] = p.rec_reasons ?? [];
          }
          setScoreMap(sm);
          setReasonMap(rm);
        }
        setCategoryStats(data.category_stats ?? []);
        setHasHistory(data.has_history ?? false);
      })
      .catch(() => {});
  }, [user?.id]);

  const searched = useMemo(() =>
    searchTerm.trim()
      ? products.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.seller_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : products,
    [products, searchTerm]
  );

  const sorted = useMemo(() => {
    const arr = [...searched];
    switch (sortMode) {
      case 'recommended': return arr.sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0));
      case 'price_asc':   return arr.sort((a, b) => a.price_single - b.price_single);
      case 'price_desc':  return arr.sort((a, b) => b.price_single - a.price_single);
      case 'newest':      return arr.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
      default:            return arr;
    }
  }, [searched, sortMode, scoreMap]);

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortMode)!;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center">
            <ShoppingCart className="w-6 h-6 text-blue-600 mr-3 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900">Browse Products</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('placeholders.searchProducts')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-500 text-sm w-44"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <span className="flex items-center gap-1.5">{activeSortLabel.icon}{activeSortLabel.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortMode(opt.value); setSortOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        sortMode === opt.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.icon}{opt.label}
                      {opt.value === 'recommended' && !hasHistory && (
                        <span className="ml-auto text-xs text-gray-400">no history yet</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-sm text-gray-400">{sorted.length} products</span>
          </div>
        </div>

        {/* Recommendation banner */}
        {sortMode === 'recommended' && (
          <div className={`mb-4 rounded-xl px-4 py-3 flex items-start gap-3 text-sm ${
            hasHistory ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-200'
          }`}>
            <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${hasHistory ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="flex-1">
              {hasHistory ? (
                <>
                  <span className="font-medium text-blue-800">Sorted by your order history.</span>
                  <span className="text-blue-700 ml-1">
                    Based on {categoryStats.length} categor{categoryStats.length === 1 ? 'y' : 'ies'} you've ordered:{' '}
                    {categoryStats.map((c, i) => (
                      <span key={c.category}>{i > 0 && ', '}<span className="font-medium">{c.category} (×{c.times_ordered})</span></span>
                    ))}.
                  </span>
                  <button onClick={() => setShowDebug(d => !d)} className="ml-2 text-blue-500 hover:text-blue-700 underline text-xs">
                    {showDebug ? 'hide scores' : 'show scores'}
                  </button>
                </>
              ) : (
                <span className="text-gray-600">
                  No order history yet — showing newest products first.{' '}
                  <span className="text-gray-500">Place some orders and recommendations will personalise automatically.</span>
                </span>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">{t('messages.loadingProducts')}</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.noProductsFound')}</h3>
            <p className="text-gray-500">{t('status.adjustSearchTerms')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((product: any) => {
              const score = scoreMap[product.id] ?? 0;
              const reasons = reasonMap[product.id] ?? [];
              const isRecommended = sortMode === 'recommended' && hasHistory && score > 0;
              const outOfStock = product.quantity === 0;

              return (
                <div
                  key={product.id}
                  className={`border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer relative ${
                    isRecommended ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => { setSelectedProduct(product); setShowProductDetails(true); }}
                >
                  {/* Recommended badge */}
                  {isRecommended && (
                    <div className="flex justify-end mb-2">
                      <div className="flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        For you
                      </div>
                    </div>
                  )}

                  {/* Debug score */}
                  {showDebug && sortMode === 'recommended' && (
                    <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-lg z-10">
                      score: {score}
                    </div>
                  )}

                  {/* Image */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    {product.photos?.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fb = (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon') as HTMLElement;
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`fallback-icon w-full h-full flex items-center justify-center ${product.photos?.length > 0 ? 'absolute inset-0' : ''}`}
                      style={{ display: product.photos?.length > 0 ? 'none' : 'flex' }}
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>{t('productInfo.category')}: {product.category}</p>
                    <p>{t('productInfo.seller')}: {product.seller_name}</p>
                    <p>{t('productInfo.location')}: {product.location}</p>
                    <p>{t('productInfo.stock')}: {product.quantity}kg</p>
                  </div>

                  {showDebug && reasons.length > 0 && (
                    <div className="mb-2 space-y-0.5">
                      {reasons.map((r, i) => (
                        <p key={i} className="text-xs text-blue-600 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />{r}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-blue-600 font-semibold">₹{product.price_single}/kg</span>
                      {product.price_multiple && (
                        <div className="text-xs text-gray-700">{t('productInfo.bulk')}: ₹{product.price_multiple}/kg</div>
                      )}
                    </div>
                    {product.price_multiple && (
                      <div className="text-xs text-green-600 font-medium">
                        {Math.round(((product.price_single - product.price_multiple) / product.price_single) * 100)}% off bulk
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={selectedQuantity[product.id] ?? 1}
                        onChange={e => setSelectedQuantity(prev => ({ ...prev, [product.id]: parseInt(e.target.value) || 1 }))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        disabled={outOfStock}
                      />
                      <span className="text-xs text-gray-700">kg</span>
                    </div>
                    {outOfStock ? (
                      <div className="flex-1 px-3 py-2 bg-red-50 text-red-500 rounded-lg text-sm text-center font-medium border border-red-200">
                        Out of Stock
                      </div>
                    ) : (
                      <button
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        onClick={() => addToCart(product.id, selectedQuantity[product.id] ?? 1)}
                      >
                        {t('Add to Cart')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showProductDetails && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={showProductDetails}
          onClose={() => { setShowProductDetails(false); setSelectedProduct(null); }}
          onAddToCart={(productId, quantity) => { addToCart(productId, quantity); setShowProductDetails(false); }}
        />
      )}
    </>
  );
}
