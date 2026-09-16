import React from 'react';
import { resolveImageUrl } from '../home/ProductCard';
import { Trash2 } from 'lucide-react';

const SubcategoryCard = ({ subcategory, onClick, isAdmin, isSelected, onSelect, onDelete }) => {
    const imageUrl = resolveImageUrl(subcategory.image);

    return (
        <div
            className="subcategory-card"
            onClick={() => onClick && onClick(subcategory.name)}
            style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '220px',
                border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
            }}
        >
            <div
                className="subcategory-image-container"
                style={{
                    width: '100%',
                    height: '180px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '24px',
                    position: 'relative'
                }}
            >
                {isAdmin && (
                    <div className="admin-actions-overlay" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                        {onSelect && (
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); onSelect(subcategory.name); }}
                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#ea580c' }}
                            />
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(subcategory.name); }}
                                className="subcat-delete-btn"
                                style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                                title="Delete Subcategory"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                )}
                <img
                    src={imageUrl}
                    alt={subcategory.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.4s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            </div>
            <div
                className="subcategory-info"
                style={{
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTop: '1px solid #f1f5f9',
                    flex: 1,
                    background: '#ffffff'
                }}
            >
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
                    {subcategory.name}
                </h3>
                <span style={{
                    fontSize: '0.85rem',
                    color: '#ea580c',
                    fontWeight: '600',
                    background: '#fff7ed',
                    padding: '4px 12px',
                    borderRadius: '20px'
                }}>
                    {subcategory.count} <span style={{ color: '#94a3b8', fontWeight: '500' }}>Variants</span>
                </span>
            </div>
        </div>
    );
};

export default SubcategoryCard;
