import React, { useState, useEffect } from 'react';
import { ApiService } from './services/api';
import { useCart } from './CartContext';
import { Plus, Check, Search, ShoppingBag } from 'lucide-react';

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [addedItems, setAddedItems] = useState({});
    const [hoveredId, setHoveredId] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await ApiService.getProducts();
                if (Array.isArray(response.data)) {
                    setProducts(response.data);
                } else {
                    console.error("Products response is not an array:", response.data);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = (item) => {
        addToCart(item);
        setAddedItems({ ...addedItems, [item.id]: true });
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [item.id]: false }));
        }, 2000);
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Loading State
    if (loading) {
        return (
            <div className="pt-32 min-h-screen flex flex-col items-center justify-center">
                <div className="w-px h-16 bg-gradient-to-b from-gold-400 to-transparent animate-pulse mb-8" />
                <p className="font-display text-xl text-gray-400 italic">Loading Collection...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory dark:bg-onyx-950 pt-24 transition-colors duration-300">
            {/* Header */}
            <header className="text-center py-16 px-6">
                <p className="font-script text-gold-600 dark:text-gold-400 text-2xl mb-4">Our Collection</p>
                <h1 className="font-display text-4xl md:text-6xl font-light text-onyx-900 dark:text-white mb-6 tracking-wide">
                    THE ATELIER
                </h1>
                <div className="divider-gold mb-8" />
                <p className="font-display text-lg text-gray-600 dark:text-gray-400 font-light italic max-w-2xl mx-auto">
                    Discover our curated selection of premium garments, each piece crafted with meticulous attention to detail
                </p>

                {/* Search */}
                <div className="max-w-md mx-auto mt-12 relative">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH COLLECTION"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 text-center"
                    />
                </div>
            </header>

            {/* Products Grid - Magazine Layout */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-32 px-6">
                    <ShoppingBag size={48} className="mx-auto mb-6 text-gray-400 dark:text-gray-600" />
                    <p className="font-display text-2xl text-onyx-900 dark:text-white mb-4">
                        {searchTerm ? 'No items found' : 'Collection Coming Soon'}
                    </p>
                    <p className="text-gray-500">
                        {searchTerm
                            ? `No pieces match "${searchTerm}"`
                            : 'Our latest collection is being prepared'
                        }
                    </p>
                </div>
            ) : (
                <div className="px-6 pb-32">
                    {/* Masonry-style Grid */}
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-onyx-900/10 dark:bg-white/5">
                        {filteredProducts.map((item, idx) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-onyx-950 group relative"
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Product Image */}
                                <div className="product-image-container aspect-[3/4]">
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Overlay Content */}
                                    <div className={`absolute inset-0 bg-black/60 flex flex-col justify-end p-8 transition-opacity duration-500 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'
                                        }`}>
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={addedItems[item.id]}
                                            className={`btn-elegant w-full ${addedItems[item.id] ? 'bg-gold-400 text-black' : ''}`}
                                        >
                                            {addedItems[item.id] ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Check size={16} /> Added
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Plus size={16} /> Add to Bag
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Product Info - Below Image */}
                                <div className="p-6 text-center border-b border-onyx-900/10 dark:border-white/5">
                                    <h3 className="font-display text-lg text-onyx-900 dark:text-white mb-2 tracking-wide">
                                        {item.name}
                                    </h3>
                                    <p className="price-tag text-gold-600 dark:text-gold-400">
                                        ₦{Number(item.price).toLocaleString()}
                                    </p>
                                    {item.description && (
                                        <p className="text-gray-600 dark:text-gray-500 text-sm mt-3 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}